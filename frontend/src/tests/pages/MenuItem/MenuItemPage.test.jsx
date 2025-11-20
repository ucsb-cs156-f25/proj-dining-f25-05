import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import MenuItemPage from "main/pages/MenuItem/MenuItemPage";
import { menuItemFixtures } from "fixtures/menuItemFixtures";

const mockToast = vi.fn();
const mockNavigate = vi.fn();

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
    useNavigate: () => mockNavigate,
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

  test("date selector is present and navigates on change", async () => {
    mockNavigate.mockClear();
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

    // Wait for the page to load
    await screen.findByTestId("MenuItemTable-cell-row-0-col-name");

    // Check that date selector is present
    const dateSelector = screen.getByTestId("date-selector");
    expect(dateSelector).toBeInTheDocument();
    expect(dateSelector).toHaveValue("2025-03-11");

    // Change the date
    const user = userEvent.setup();
    await user.clear(dateSelector);
    await user.type(dateSelector, "2025-03-15");

    // Verify navigation was called with the new URL
    expect(mockNavigate).toHaveBeenCalledWith(
      "/diningcommons/2025-03-15/carrillo/breakfast",
    );
  });
});
