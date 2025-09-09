'use client';
import Navigation from '@/app/components/Menus/Navigation';
import BackButton from '@/app/components/Buttons/BackButton';
import ProfileThumb from '@/app/components/Profile/ProfileThumb';

export default function Components() {
  return (
    <>
      <Navigation />
      <main style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: '1rem' }}>
        <BackButton buttonStyle="regular" />
        <BackButton buttonStyle="arrowdown" />
        <BackButton buttonStyle="blur" />
        <BackButton buttonStyle="smallarrow" />

        <ProfileThumb online={true} shadow={false} />
        <ProfileThumb />
        <ProfileThumb online={true} disabled={true} />
        <ProfileThumb disabled={true} />
        <ProfileThumb size="small" online={true} />
        <ProfileThumb size="large" online={true} />
      </main>
    </>
  );
}
