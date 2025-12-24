import ACTIVITY_MANAGEMENT from '../pages/activity-management.jsx';
import ADMIN from '../pages/admin.jsx';
import DATA_EXPORT from '../pages/data-export.jsx';
import ORDER_MANAGEMENT from '../pages/order-management.jsx';
export const routers = [{
  id: "activity-management",
  component: ACTIVITY_MANAGEMENT
}, {
  id: "admin",
  component: ADMIN
}, {
  id: "data-export",
  component: DATA_EXPORT
}, {
  id: "order-management",
  component: ORDER_MANAGEMENT
}]