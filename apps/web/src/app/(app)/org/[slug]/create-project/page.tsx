import { ProjectForm } from './project-form';

export default function CreateProject() {
  return (
    <div className="mx-auto w-2/3 space-y-4">
      <h1 className="text-2xl font-bold">Create Project</h1>
      <ProjectForm />
    </div>
  );
}
