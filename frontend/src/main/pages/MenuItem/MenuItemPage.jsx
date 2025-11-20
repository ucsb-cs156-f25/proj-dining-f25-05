import { useCurrentUser } from "main/utils/currentUser";
import { useBackend } from "main/utils/useBackend";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import MenuItemTable from "main/components/MenuItem/MenuItemTable";
import { useParams, useNavigate } from "react-router";
import { Form } from "react-bootstrap";
import { useEffect, useState } from "react";

export default function MenuItemPage() {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const {
    "date-time": date,
    "dining-commons-code": diningCommons,
    meal,
  } = useParams();
  const [selectedDate, setSelectedDate] = useState(date);

  // Update selectedDate when URL param changes
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const { data: menuItems } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    [`/api/diningcommons/${date}/${diningCommons}/${meal}`],
    {
      // Stryker disable next-line all : the default method is get, so replacing with an empty string will do nothing
      method: "GET",
      url: `/api/diningcommons/${date}/${diningCommons}/${meal}`,
    },
    // Stryker disable next-line all : Don't test empty initial data
    [],
  );

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    navigate(`/diningcommons/${newDate}/${diningCommons}/${meal}`);
  };

  return (
    <BasicLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{meal.at(0).toUpperCase() + meal.substring(1)}</h2>
        <Form.Group controlId="date-selector" className="mb-0">
          <Form.Label className="me-2">Select Date:</Form.Label>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            data-testid="date-selector"
          />
        </Form.Group>
      </div>
      <MenuItemTable currentUser={currentUser} menuItems={menuItems} />
    </BasicLayout>
  );
}
