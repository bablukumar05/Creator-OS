const workspace = '/images/backgrounds/workspace.webp';
const camera = '/images/backgrounds/camera.webp';
const planning = '/images/backgrounds/planning.webp';
export const pageBackgrounds = {
  dashboard: workspace,
  content: camera,
  calendar: planning,
  brands: workspace,
  deals: planning,
  campaigns: planning,
  tasks: planning,
  revenue: planning,
  expenses: planning,
  invoices: planning,
  analytics: workspace,
  media: camera,
  notifications: planning,
  profile: workspace,
  settings: workspace,
  admin: workspace,
  auth: workspace,
};
export function PageBackground({ page = 'dashboard', className = '' }) {
  return (
    <div aria-hidden="true" className={`page-decoration ${className}`}>
      <img
        src={pageBackgrounds[page] || workspace}
        alt=""
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}