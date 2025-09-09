import ProfileTrainer from '@/app/components/Profile/ProfileTrainer';

export default function TrainerPage({ params }) {
  return <ProfileTrainer alias={params.alias} />;
}
