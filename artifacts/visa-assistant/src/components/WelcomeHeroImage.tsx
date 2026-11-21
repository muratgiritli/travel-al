// Hero background for the welcome screen.
// The bundled artwork ships as responsive WebP so phones fetch ~55 kB instead
// of the 2.7 MB source JPG. Admin-supplied URLs are used as-is.

const DEFAULT_BG = '/istanbul-welcome-bg.jpg';

const DEFAULT_SRCSET = [
  '/istanbul-welcome-bg-720.webp 720w',
  '/istanbul-welcome-bg-1080.webp 1080w',
  '/istanbul-welcome-bg-1536.webp 1536w',
].join(', ');

/** 24px WebP of the same photo, inlined so the frame is never empty. */
const LQIP =
  'data:image/webp;base64,UklGRrQAAABXRUJQVlA4IKgAAADQBACdASoYABAAPu1iqU2ppaOiMAgBMB2JbACdMoMYOHXb/4DepJEN5RESeP1dAAD+6ph/Bu1p+QoRM2GHLTqht/HjN19oY51vZDJ1sB/iP9g+pWiu7NMkyRV8ncrpNIr4rOZpOf9KUyWlEHGS77vYFGKrcdr6pzE2uNUegfzmGxzlLb2WHQn8VNgyjIv0E5rM7CsyEKL7DiQT8B6qJ56bwHH4egAAAAA=';

export function WelcomeHeroImage({ src }: { src?: string }) {
  const url = src || DEFAULT_BG;
  const isDefault = url === DEFAULT_BG;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        backgroundImage: `url(${LQIP})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 35%',
      }}
      aria-hidden
    >
      <img
        src={isDefault ? '/istanbul-welcome-bg-1080.webp' : url}
        {...(isDefault ? { srcSet: DEFAULT_SRCSET } : {})}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 720px, 1080px"
        alt=""
        width={1536}
        height={1024}
        decoding="async"
        fetchPriority="high"
        className="w-full h-full object-cover"
        style={{
          objectPosition: 'center 35%',
          filter: 'saturate(1.15) contrast(1.06)',
        }}
      />
    </div>
  );
}
