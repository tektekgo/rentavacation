import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import mermaid from 'mermaid';
import { allFlows, flowToMermaid } from '@/flows';
import type { FlowDefinition } from '@/flows/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Initialize mermaid with RAV brand colors
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#0d7377',
    primaryTextColor: '#fff',
    primaryBorderColor: '#0a5c5f',
    lineColor: '#0d7377',
    secondaryColor: '#f5f0e8',
    tertiaryColor: '#fef3c7',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    // Edge label styling — dark text on a visible background
    edgeLabelBackground: '#e2e8f0',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 20,
    nodeSpacing: 30,
    rankSpacing: 50,
  },
});

function MermaidDiagram({ flow }: { flow: FlowDefinition }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const renderDiagram = useCallback(async () => {
    if (!containerRef.current) return;
    
    const mermaidCode = flowToMermaid(flow);
    const id = `mermaid-${flow.id}-${Date.now()}`;
    
    try {
      const { svg } = await mermaid.render(id, mermaidCode);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        
        // Make nodes clickable — navigate to the step's route
        const nodes = containerRef.current.querySelectorAll('.node');
        nodes.forEach((node) => {
          const textEl = node.querySelector('.nodeLabel');
          if (!textEl) return;
          
          const label = textEl.textContent?.trim();
          const step = flow.steps.find(s => s.label === label);
          if (step?.route) {
            (node as HTMLElement).style.cursor = 'pointer';
            node.addEventListener('click', () => {
              const path = step.tab ? `${step.route}?tab=${step.tab}` : step.route;
              navigate(path);
            });
          }
        });
      }
      setError(null);
    } catch (err) {
      console.error('Mermaid render error:', err);
      setError('Failed to render diagram');
    }
  }, [flow, navigate]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-destructive/10 text-destructive text-center">
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full overflow-x-auto p-4 [&_svg]:mx-auto [&_.node]:transition-opacity [&_.node:hover]:opacity-80"
    />
  );
}

function FlowMetadata({ flow }: { flow: FlowDefinition }) {
  const routeCount = new Set(flow.steps.map(s => s.route)).size;
  const tableCount = new Set(flow.steps.flatMap(s => s.tables || [])).size;
  const edgeFnCount = new Set(flow.steps.flatMap(s => s.edgeFunctions || [])).size;
  const branchCount = flow.steps.reduce((acc, s) => acc + (s.branches?.length || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetricCard label="Steps" value={flow.steps.length} />
      <MetricCard label="Routes" value={routeCount} />
      <MetricCard label="DB Tables" value={tableCount} />
      <MetricCard label="Edge Functions" value={edgeFnCount} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StepTable({ flow }: { flow: FlowDefinition }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-medium text-muted-foreground">Step</th>
            <th className="text-left p-2 font-medium text-muted-foreground">Route</th>
            <th className="text-left p-2 font-medium text-muted-foreground">Component</th>
            <th className="text-left p-2 font-medium text-muted-foreground hidden md:table-cell">Tables</th>
            <th className="text-left p-2 font-medium text-muted-foreground hidden lg:table-cell">Branches</th>
          </tr>
        </thead>
        <tbody>
          {flow.steps.map((step) => (
            <tr key={step.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-2 font-medium">{step.label}</td>
              <td className="p-2">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {step.route}{step.tab ? `?tab=${step.tab}` : ''}
                </code>
              </td>
              <td className="p-2 text-muted-foreground">{step.component}</td>
              <td className="p-2 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {step.tables?.map(t => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </td>
              <td className="p-2 hidden lg:table-cell text-muted-foreground">
                {step.branches?.map(b => b.condition).join(', ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Architecture() {
  const { user, roles, isRavTeam, isLoading } = useAuth();
  const navigate = useNavigate();
  const [rolesChecked, setRolesChecked] = useState(false);

  // Wait for roles to load — they arrive async after isLoading goes false
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login', { state: { from: '/architecture' } });
      return;
    }
    // Give roles time to load (they're fetched in setTimeout in AuthContext)
    if (roles.length === 0 && !rolesChecked) {
      const timer = setTimeout(() => setRolesChecked(true), 1500);
      return () => clearTimeout(timer);
    }
    if ((roles.length > 0 || rolesChecked) && !isRavTeam()) {
      navigate('/');
    }
  }, [isLoading, user, roles, rolesChecked, isRavTeam, navigate]);

  if (isLoading || (!rolesChecked && roles.length === 0)) return null;
  if (!user || !isRavTeam()) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Branded header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-display text-foreground">
              System Architecture
            </h1>
            <Badge className="bg-primary text-primary-foreground">RAV Team</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Interactive flow diagrams auto-generated from <code className="text-xs bg-muted px-1.5 py-0.5 rounded">src/flows/</code> manifests. 
            Click any node to navigate to that page. Diagrams stay in sync with code.
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Flow tabs */}
        <Tabs defaultValue={allFlows[0].id}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            {allFlows.map(flow => (
              <TabsTrigger key={flow.id} value={flow.id} className="gap-2">
                <span>{flow.roleEmoji}</span>
                <span>{flow.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {allFlows.map(flow => (
            <TabsContent key={flow.id} value={flow.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{flow.roleEmoji}</span>
                    {flow.label}
                  </CardTitle>
                  <CardDescription>{flow.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FlowMetadata flow={flow} />
                  
                  <Separator />
                  
                  {/* Mermaid diagram */}
                  <div className="border rounded-lg bg-card">
                    <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Interactive Flow Diagram
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Click nodes to navigate
                      </span>
                    </div>
                    <MermaidDiagram flow={flow} />
                  </div>

                  <Separator />

                  {/* Step details table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Step Details</h3>
                    <StepTable flow={flow} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Automation stats footer */}
        <Card className="mt-8 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Automation Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Diagrams generated from declarative manifests in <code className="text-xs bg-muted px-1 py-0.5 rounded">src/flows/</code>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">~90%</div>
                  <div className="text-xs text-muted-foreground">Auto-generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">~10%</div>
                  <div className="text-xs text-muted-foreground">Manual branches</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
