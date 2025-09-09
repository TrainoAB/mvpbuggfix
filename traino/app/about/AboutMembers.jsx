const AboutMembers = () => {
  const teamMembers = [
    {
      name: 'Kevin McLaughlin Önder',
      image: 'about-placeholder.png',
      title: 'CEO',
      email: 'kevin@traino.nu',
      phone: '+4665921887',
    },
    {
      name: 'Fredrik Berglund',
      image: 'about-placeholder.png',
      title: 'Tech Lead',
      email: 'fredrik.berglund@traino.nu',
      phone: null,
    },
    {
      name: 'Kevin Gibba',
      image: 'about-placeholder.png',
      title: 'Product Lead',
      email: 'kevin.gibba@traino.nu',
      phone: null,
    },
    {
      name: 'Emma Johansson',
      image: 'about-placeholder.png',
      title: 'Board Member',
      email: null,
      phone: null,
    },
    {
      name: 'Philip Chohan',
      image: 'about-placeholder.png',
      title: 'Head of Sales & Board Member',
      email: null,
      phone: null,
    },
    {
      name: 'Samuel Ward',
      image: 'about-placeholder.png',
      title: 'Fullstack Developer (Intern)',
      email: null,
      phone: null,
    },
    {
      name: 'Mattias Johansson',
      image: 'about-placeholder.png',
      title: 'Fullstack Developer (Intern)',
      email: null,
      phone: null,
    },
    {
      name: 'Joel Rollny',
      image: 'about-placeholder.png',
      title: 'Fullstack Developer (Intern)',
      email: null,
      phone: null,
    },
    {
      name: 'Abbas Mansoori',
      image: 'about-placeholder.png',
      title: 'Fullstack Developer (Intern)',
      email: null,
      phone: null,
    },
  ];

  return (
    <div className="content">
      <div className="team-wrap">
        {teamMembers.map((member, index) => (
          <div className="team-member" key={index}>
            <img src={'./assets/' + member.image} title="About Placeholder" />
            <div>
              <h5>{member.name}</h5>
              {member.title && <p className="description-text">{member.title}</p>}
              {member.email && <p className="description-text">{member.email}</p>}
              {member.phone && <p className="description-text">{member.phone}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutMembers;
