import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import MealTimesPage from "main/pages/Meal/MealTimesPage";
import { mealFixtures } from "fixtures/mealFixtures";
import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import { vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => ({
      "date-time": "2024-11-25",
      "dining-commons-code": "portola",
    }),
    Navigate: (x) => {
      mockNavigate(x);
      return null;
    },
  };
});

const queryClient = new QueryClient();

describe("MealTimesPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  beforeEach(() => {
    vi.spyOn(console, "error");
    console.error.mockImplementation(() => null);
  });
  beforeEach(() => {
    axiosMock.reset();
    axiosMock
      .onGet("/api/diningcommons/2024-11-25/portola")
      .reply(200, mealFixtures.threeMeals);
  });

  test("renders without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/diningcommons/2024-11-25/portola"]}>
          <MealTimesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });

  test("displays correct information in the table", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/diningcommons/2024-11-25/portola"]}>
          <MealTimesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Wait for the meal information to be loaded
    await screen.findByText("Meals at portola for 2024-11-25");

    // Ensure that the header is correct
    expect(
      screen.getByText("Meals at portola for 2024-11-25"),
    ).toBeInTheDocument();

    // Check that each meal time is displayed correctly
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();

    // Verify loading is not shown when we have data
    expect(screen.queryByText("Loading meals...")).not.toBeInTheDocument();
  });

  test("displays loading spinner while fetching data", async () => {
    axiosMock.reset();
    axiosMock.onGet("/api/diningcommons/2024-11-25/portola").reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, mealFixtures.threeMeals]);
        }, 100);
      });
    });

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <MemoryRouter initialEntries={["/diningcommons/2024-11-25/portola"]}>
          <MealTimesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Loading meals...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await screen.findByText("Breakfast");
  });

  test("displays 'No meals offered today.' when there are no meals", async () => {
    axiosMock.reset();
    axiosMock.onGet("/api/diningcommons/2024-11-25/portola").reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, []]);
        }, 10);
      });
    });

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <MemoryRouter initialEntries={["/diningcommons/2024-11-25/portola"]}>
          <MealTimesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByText("No meals offered today.");
    expect(screen.getByText("No meals offered today.")).toBeInTheDocument();
    expect(screen.queryByText("Loading meals...")).not.toBeInTheDocument();
  });

  test("displays loading when fetching empty meals array", async () => {
    axiosMock.reset();
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axiosMock
      .onGet("/api/diningcommons/2024-11-25/portola")
      .reply(() => promise);

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <MemoryRouter initialEntries={["/diningcommons/2024-11-25/portola"]}>
          <MealTimesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Should show loading initially
    expect(screen.getByText("Loading meals...")).toBeInTheDocument();

    // Resolve with empty array
    resolvePromise([200, []]);

    // Should eventually show no meals message
    await screen.findByText("No meals offered today.");
  });
});
