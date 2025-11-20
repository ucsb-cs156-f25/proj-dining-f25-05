import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";

import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import MenuItemPage from "main/pages/MenuItem/MenuItemPage";
import { menuItemFixtures } from "fixtures/menuItemFixtures";

const mockToast = vi.fn();
vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    __esModule: true,
    ...originalModule,
    toast: (x) => mockToast(x),
  };
});

vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => ({
      "date-time": "2025-03-11",
      "dining-commons-code": "carrillo",
      meal: "breakfast",
    }),
  };
});

describe("MenuItemPage", () => {
  let axiosMock;
  let queryClient;

  beforeAll(() => {
    axiosMock = new AxiosMockAdapter(axios);
    queryClient = new QueryClient();
  });

  afterEach(() => {
    axiosMock.reset();
    queryClient.clear();
  });

  test("MenuItemPage works with no backend", async () => {
    axiosMock
      .onGet("/api/diningcommons/2025-03-11/carrillo/breakfast")
      .timeout();
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MenuItemPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(axiosMock.history.get.length).toBe(3);
    });

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(
      screen.queryByText("MenuItemTable-cell-header-col-name"),
    ).not.toBeInTheDocument();
  });
});

describe("MenuItemPage renders table correctly", () => {
  let axiosMock;
  let queryClient;

  beforeAll(() => {
    axiosMock = new AxiosMockAdapter(axios);
    queryClient = new QueryClient();
  });

  afterEach(() => {
    axiosMock.reset();
    queryClient.clear();
  });
  test("MenuItemPage renders 5 Menu Items Correctly", async () => {
    axiosMock
      .onGet("/api/diningcommons/2025-03-11/carrillo/breakfast")
      .reply(200, menuItemFixtures.fiveMenuItems);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MenuItemPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByTestId("MenuItemTable-cell-row-0-col-name");
    for (let i = 0; i < menuItemFixtures.fiveMenuItems.length; i++) {
      expect(
        screen.getByTestId(`MenuItemTable-cell-row-${i}-col-name`),
      ).toHaveTextContent(menuItemFixtures.fiveMenuItems[i].name);
      expect(
        screen.getByTestId(`MenuItemTable-cell-row-${i}-col-station`),
      ).toHaveTextContent(menuItemFixtures.fiveMenuItems[i].station);
    }
  });

  test("displays 'No menu items offered today.' when there are no menu items", async () => {
    axiosMock.reset();
    axiosMock
      .onGet("/api/diningcommons/2025-03-11/carrillo/breakfast")
      .reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, []]);
          }, 10);
        });
      });
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <MemoryRouter>
          <MenuItemPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Wait for the message to appear
    await screen.findByText("No menu items offered today.");

    // Ensure the message is displayed
    expect(screen.getByText("No menu items offered today.")).toBeInTheDocument();
    expect(screen.queryByText("Loading menu items...")).not.toBeInTheDocument();
  });

  test("displays loading spinner while fetching data", async () => {
    axiosMock.reset();
    axiosMock
      .onGet("/api/diningcommons/2025-03-11/carrillo/breakfast")
      .reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, menuItemFixtures.fiveMenuItems]);
          }, 100);
        });
      });
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <MemoryRouter>
          <MenuItemPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Loading menu items...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await screen.findByTestId("MenuItemTable-cell-row-0-col-name");
  });

  test("displays loading when fetching empty menu items array", async () => {
    axiosMock.reset();
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axiosMock
      .onGet("/api/diningcommons/2025-03-11/carrillo/breakfast")
      .reply(() => promise);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <MemoryRouter>
          <MenuItemPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Should show loading initially
    expect(screen.getByText("Loading menu items...")).toBeInTheDocument();

    // Resolve with empty array
    resolvePromise([200, []]);

    // Should eventually show no menu items message
    await screen.findByText("No menu items offered today.");
  });
});
