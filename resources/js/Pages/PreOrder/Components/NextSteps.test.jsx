import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NextSteps from "./NextSteps";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children }) => children,
    router: { post: vi.fn() },
    useForm: (initial) => ({
        data: initial,
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        transform: vi.fn(),
    }),
}));

const base = {
    id: 7,
    stage: { label: "Under review", owner: "bion", next_action: "BION is reviewing the case" },
    exception: null,
    closed_at: null,
    items: [],
    requests: [],
    quotations: [],
    orders_to_place: [],
    center_can: {},
};
const name = () => "Mother Example";

describe("NextSteps", () => {
    it("says nothing is needed while BION works", () => {
        render(
            <NextSteps preOrder={base} orders={[]} patientName={name} onShowSamples={vi.fn()} />
        );

        expect(screen.getByText("Nothing needed from you right now")).toBeInTheDocument();
        expect(screen.getByText("Next: BION is reviewing the case")).toBeInTheDocument();
    });

    it("puts an open quotation first, with approve buttons for an approver", () => {
        const preOrder = {
            ...base,
            stage: { ...base.stage, owner: "center" },
            quotations: [
                {
                    number: "Q-26-0001",
                    status: "awaiting_center",
                    request: null,
                    total: "120.000",
                    lines: [
                        {
                            id: 1,
                            test_name: "PGT-M",
                            patient_ref: "P1",
                            qty: 1,
                            unit_price: "120.000",
                            total: "120.000",
                        },
                    ],
                    reasons: [],
                },
            ],
        };
        render(
            <NextSteps
                preOrder={preOrder}
                orders={[]}
                canAct
                canApproveFinance
                patientName={name}
                onShowSamples={vi.fn()}
            />
        );

        expect(screen.getByText("What you need to do")).toBeInTheDocument();
        expect(screen.getByText("Approve the cost of the tests")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /approve/i }).length).toBeGreaterThan(0);
    });

    it("tells a user without the approval permission who must approve", () => {
        const preOrder = {
            ...base,
            quotations: [
                {
                    number: "Q-1",
                    status: "awaiting_center",
                    request: null,
                    total: "1",
                    lines: [],
                    reasons: [],
                },
            ],
        };
        render(
            <NextSteps
                preOrder={preOrder}
                orders={[]}
                canAct
                patientName={name}
                onShowSamples={vi.fn()}
            />
        );

        expect(screen.getByText(/Only users allowed to approve costs/)).toBeInTheDocument();
    });
});
