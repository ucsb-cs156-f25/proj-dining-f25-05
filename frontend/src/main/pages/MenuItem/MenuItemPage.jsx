import { useCurrentUser } from "main/utils/currentUser";
import { useBackend } from "main/utils/useBackend";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import MenuItemTable from "main/components/MenuItem/MenuItemTable";
import { useParams } from "react-router";

export default function MenuItemPage() {
  const currentUser = useCurrentUser();
  const {
    "date-time": date,
    "dining-commons-code": diningCommons,
    meal,
  } = useParams();
  const {
    data: menuItems,
    status,
    isFetching,
  } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    [`/api/diningcommons/${date}/${diningCommons}/${meal}`],
    {
      // Stryker disable next-line all : the default method is get, so replacing with an empty string will do nothing
      method: "GET",
      url: `/api/diningcommons/${date}/${diningCommons}/${meal}`,
    },
  );

  // Show loading if we're fetching and don't have real data yet (just initial data)
  const isLoading = isFetching && (!menuItems || menuItems.length === 0);
  const hasData = menuItems && menuItems.length > 0;

  return (
    <BasicLayout>
      <div className="pt-2">
        <h2>{meal.at(0).toUpperCase() + meal.substring(1)}</h2>
        {isLoading ? (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading menu items...</p>
          </div>
        ) : hasData ? (
          <MenuItemTable currentUser={currentUser} menuItems={menuItems} />
        ) : (
          <p className="text-center mt-4">No menu items offered today.</p>
        )}
      </div>
    </BasicLayout>
  );
}
