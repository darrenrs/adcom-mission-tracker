import { useEffect, useState } from 'react';

export function Footer() {
  const [build, setBuild] = useState('');

  useEffect(() => {
    let active = true;
    fetch('api/build')
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => active && setBuild(text))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="mx-auto w-full max-w-360 space-y-1 px-4 pb-24 text-xs text-muted sm:pb-6">
      <p>
        Issues or suggestions? The project is on{' '}
        <a className="underline" href="https://github.com/darrenrs/adcom-mission-tracker">
          GitHub
        </a>
        .
      </p>
      <p>
        {build && `Build ${build} · `}
        <a className="underline" href="https://idlegametools.com/privacy#adcom-mission-tracker">
          Privacy
        </a>
        {' · '}
        <a className="underline" href="https://idlegametools.com/terms">
          Terms
        </a>
      </p>
      <p>
        This material is not official and is not endorsed by Hyper Hippo. See Hyper Hippo's{' '}
        <a className="underline" href="https://hyperhippo.com/fan-content-policy/">
          Fan Content Policy
        </a>
        .
      </p>
    </footer>
  );
}
