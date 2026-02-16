import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertCircle } from "lucide-react";
import { ActionSuccessCard } from "./ActionSuccessCard";

describe("ActionSuccessCard", () => {
  it("renders title and description", () => {
    render(
      <ActionSuccessCard
        title="Success!"
        description="Your action was completed."
      />
    );

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Your action was completed.")).toBeInTheDocument();
  });

  it("renders reference label and value when provided", () => {
    render(
      <ActionSuccessCard
        title="Done"
        description="All set."
        referenceLabel="Bid Amount"
        referenceValue="$1,200"
      />
    );

    expect(screen.getByText(/Bid Amount:/)).toBeInTheDocument();
    expect(screen.getByText("$1,200")).toBeInTheDocument();
  });

  it("shows email sent indicator when emailSent is true", () => {
    render(
      <ActionSuccessCard
        title="Done"
        description="All set."
        emailSent
      />
    );

    expect(screen.getByText("Confirmation email sent")).toBeInTheDocument();
  });

  it("does not show email indicator when emailSent is false", () => {
    render(
      <ActionSuccessCard
        title="Done"
        description="All set."
      />
    );

    expect(screen.queryByText("Confirmation email sent")).not.toBeInTheDocument();
  });

  it("renders action buttons and handles clicks", () => {
    const handleDone = vi.fn();
    const handleNext = vi.fn();

    render(
      <ActionSuccessCard
        title="Done"
        description="All set."
        actions={[
          { label: "Done", onClick: handleDone },
          { label: "Next Step", onClick: handleNext, variant: "outline" },
        ]}
      />
    );

    const doneBtn = screen.getByRole("button", { name: "Done" });
    const nextBtn = screen.getByRole("button", { name: "Next Step" });

    expect(doneBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    fireEvent.click(doneBtn);
    expect(handleDone).toHaveBeenCalledOnce();

    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledOnce();
  });

  it("accepts a custom icon and iconClassName", () => {
    const { container } = render(
      <ActionSuccessCard
        icon={AlertCircle}
        iconClassName="text-red-500"
        title="Error"
        description="Something went wrong."
      />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains("text-red-500")).toBe(true);
  });

  it("renders ReactNode description", () => {
    render(
      <ActionSuccessCard
        title="Done"
        description={<p data-testid="custom-desc">Custom content</p>}
      />
    );

    expect(screen.getByTestId("custom-desc")).toBeInTheDocument();
  });
});
