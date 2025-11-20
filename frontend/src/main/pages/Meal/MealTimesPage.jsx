import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { useParams } from "react-router";
import { useBackend } from "main/utils/useBackend";
import MealTable from "main/components/Meal/MealTable";

export default function MealTimesPage() {
  // Stryker disable next-line all : Can't test state because hook is internal
  let { "date-time": dateTime, "dining-commons-code": diningCommonsCode } =
    useParams();

  const {
    data: meals,
    error: _error,
    isFetching,
  } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    [`/api/diningcommons/${dateTime}/${diningCommonsCode}`],
    { url: `/api/diningcommons/${dateTime}/${diningCommonsCode}` },
  );

  // Show loading if we're fetching and don't have real data yet (just initial data)
  const isLoading = isFetching && (!meals || meals.length === 0);
  const hasData = meals && meals.length > 0;

  return (
    <BasicLayout>
      <div className="pt-2">
        {/* You can display all meal times of the dining common on a certain date */}
        <h1>
          Meals at {diningCommonsCode} for {dateTime}
        </h1>
        {isLoading ? (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading meals...</p>
          </div>
        ) : hasData ? (
          <MealTable
            meals={meals}
            dateTime={dateTime}
            diningCommonsCode={diningCommonsCode}
          />
        ) : (
          <p className="text-center mt-4">No meals offered today.</p>
        )}
      </div>
    </BasicLayout>
  );
}
