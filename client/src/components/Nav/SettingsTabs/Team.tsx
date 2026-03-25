import TeamManagementPanel from '~/components/Teams/TeamManagementPanel';

export default function Team() {
  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">
      <TeamManagementPanel />
    </div>
  );
}
