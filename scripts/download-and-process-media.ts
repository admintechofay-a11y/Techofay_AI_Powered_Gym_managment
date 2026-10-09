import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

interface ShotDefinition {
  id: string;
  name: string;
  unsplashId: string;
  alt: string;
  focalPoint: string;
  photographer: string;
  sourceUrl: string;
  license: string;
}

const SHOTS: ShotDefinition[] = [
  {
    id: 'hero',
    name: 'Hero Athlete Strength',
    unsplashId: 'photo-1583454110551-21f2fa2afe61',
    alt: 'Elite athlete performing focused dumbbell strength training in dramatic moody lighting',
    focalPoint: 'right center',
    photographer: 'Arthur Edelmans',
    sourceUrl: 'https://unsplash.com/photos/man-holding-dumbbell-50MIe52ZCK8',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'free-weights',
    name: 'Free Weights & Strength Floor',
    unsplashId: 'photo-1540497077202-7c8a3999166f',
    alt: 'Heavy iron dumbbell sets and Olympic barbell strength training zone',
    focalPoint: 'center',
    photographer: 'Victor Freitas',
    sourceUrl: 'https://unsplash.com/photos/row-of-dumbbells-qZ-KDhpSkwE',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'cardio',
    name: 'Cardio Zone',
    unsplashId: 'photo-1574680096145-d05b474e2155',
    alt: 'Modern cardio zone with smart console treadmills and cycle ergometers',
    focalPoint: 'center',
    photographer: 'Jonathan Borba',
    sourceUrl: 'https://unsplash.com/photos/woman-running-on-treadmill-ZF_45jkmP1k',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'group-class',
    name: 'Group HIIT & Functional Class',
    unsplashId: 'photo-1518611012118-696072aa579a',
    alt: 'High-energy group HIIT fitness session with certified instructors',
    focalPoint: 'center',
    photographer: 'Geert Pieters',
    sourceUrl: 'https://unsplash.com/photos/group-of-people-exercising-in-gym-3RnkZpDxoqY',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'personal-trainer',
    name: 'Personal Trainer Coaching',
    unsplashId: 'photo-1571019614242-c5c5dee9f50b',
    alt: 'Certified personal trainer coaching a client on proper barbell movement form',
    focalPoint: 'center',
    photographer: 'Cesar Galeão',
    sourceUrl: 'https://unsplash.com/photos/trainer-guiding-client-YTRwA7c1e5k',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'boxing',
    name: 'Boxing & Combat Arena',
    unsplashId: 'photo-1549719386-74dfcbf7dbed',
    alt: 'Functional boxing arena with leather heavy bags and conditioning turf',
    focalPoint: 'center',
    photographer: 'Attila Hercgh',
    sourceUrl: 'https://unsplash.com/photos/boxing-heavy-bags-in-gym-N_P4Kj4R5_s',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'locker-room',
    name: 'Executive Locker Rooms & Amenities',
    unsplashId: 'photo-1584622650111-993a426fbf0a',
    alt: 'Immaculate executive locker rooms with digital keyless lockers and private showers',
    focalPoint: 'center',
    photographer: 'Sanibell',
    sourceUrl: 'https://unsplash.com/photos/modern-clean-locker-facility-u_4Wc0y1RzQ',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'reception',
    name: 'Reception & Access Control Desk',
    unsplashId: 'photo-1595859703065-2259982784bb',
    alt: 'Sleek gym reception counter equipped with contactless turnstile check-in',
    focalPoint: 'center',
    photographer: 'Proxyclick',
    sourceUrl: 'https://unsplash.com/photos/modern-reception-lobby-counter-8b_G3FqX4sA',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'nutrition',
    name: 'Nutrition & Meal Prep',
    unsplashId: 'photo-1547592180-85f173990554',
    alt: 'Macro-balanced high-protein fitness meal prep designed for optimal muscle recovery',
    focalPoint: 'center',
    photographer: 'Eiliv Aceron',
    sourceUrl: 'https://unsplash.com/photos/healthy-protein-salad-bowl-ZuIDLSz3Bgk',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'body-measurement',
    name: 'Body Composition & Biometrics',
    unsplashId: 'photo-1576091160399-112ba8d25d1d',
    alt: 'Biometric body composition analysis and circumference progress tracking',
    focalPoint: 'center',
    photographer: 'National Cancer Institute',
    sourceUrl: 'https://unsplash.com/photos/medical-fitness-assessment-consultation-E330GS_w8zM',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'stretching-recovery',
    name: 'Recovery & Mobility Zone',
    unsplashId: 'photo-1506126613408-eca07ce68773',
    alt: 'Dedicated recovery lounge with yoga mats, mobility rollers, and stretch bands',
    focalPoint: 'center',
    photographer: 'Dylan Gillis',
    sourceUrl: 'https://unsplash.com/photos/athlete-stretching-on-mat-KdeqA3aTnBY',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'texture-dark',
    name: 'Dark Matte Texture Background',
    unsplashId: 'photo-1518640467707-6811f4a6ab73',
    alt: 'Abstract dark slate gym texture background for contrast panels',
    focalPoint: 'center',
    photographer: 'Patrick Hendry',
    sourceUrl: 'https://unsplash.com/photos/dark-textured-surface-background-w8Y9u1m0r9Y',
    license: 'Unsplash Free Commercial License',
  },
  {
    id: 'saas-owner-tablet',
    name: 'Gym Owner Dashboard Management',
    unsplashId: 'photo-1556740758-90de374c12ad',
    alt: 'Gym owner reviewing live member check-ins and revenue analytics on a digital tablet',
    focalPoint: 'center',
    photographer: 'Blake Wisz',
    sourceUrl: 'https://unsplash.com/photos/person-holding-black-ipad-g1Kr4Ozfoac',
    license: 'Unsplash Free Commercial License',
  },
];

async function ensureUnder200KB(
  baseSharp: sharp.Sharp,
  width: number,
  format: 'webp' | 'avif'
): Promise<Buffer> {
  let quality = format === 'webp' ? 75 : 62;
  let targetWidth = width;

  while (quality >= 20) {
    const pipeline = baseSharp.clone().resize({ width: targetWidth, withoutEnlargement: true });
    let buf: Buffer;
    if (format === 'webp') {
      buf = await pipeline.webp({ quality, effort: 6 }).toBuffer();
    } else {
      buf = await pipeline.avif({ quality, effort: 6 }).toBuffer();
    }

    if (buf.length <= 195 * 1024) {
      return buf;
    }
    quality -= 6;
    if (quality < 25 && targetWidth > 1400) {
      targetWidth = Math.round(targetWidth * 0.9);
      quality = format === 'webp' ? 65 : 55;
    }
  }

  // Final fallback
  if (format === 'webp') {
    return baseSharp.clone().resize({ width: Math.min(targetWidth, 1440) }).webp({ quality: 40 }).toBuffer();
  }
  return baseSharp.clone().resize({ width: Math.min(targetWidth, 1440) }).avif({ quality: 35 }).toBuffer();
}

async function run() {
  const imagesDir = path.resolve('apps/web/public/images');
  const videosDir = path.resolve('apps/web/public/videos');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  console.log(`Verifying and ensuring all files strictly meet < 200KB limit...`);
  const sizes = [640, 1280, 1920];

  for (const shot of SHOTS) {
    const origUrl = `https://images.unsplash.com/${shot.unsplashId}?q=85&w=2400&auto=format&fit=crop`;
    
    // Check if we need to regenerate
    let needsRegen = false;
    for (const size of sizes) {
      const webpPath = path.join(imagesDir, `${shot.id}-${size}.webp`);
      const avifPath = path.join(imagesDir, `${shot.id}-${size}.avif`);
      if (!fs.existsSync(webpPath) || !fs.existsSync(avifPath)) {
        needsRegen = true;
      } else {
        const webpSize = fs.statSync(webpPath).size;
        const avifSize = fs.statSync(avifPath).size;
        if (webpSize > 200 * 1024 || avifSize > 200 * 1024) {
          needsRegen = true;
        }
      }
    }

    if (needsRegen) {
      console.log(`Re-processing shot [${shot.id}] to guarantee < 200KB...`);
      const response = await fetch(origUrl);
      const arrayBuf = await response.arrayBuffer();
      const origBuffer = Buffer.from(arrayBuf);

      const baseSharp = sharp(origBuffer)
        .modulate({
          brightness: 0.92,
          saturation: 0.38,
        })
        .linear(1.18, -12);

      for (const size of sizes) {
        const webpBuf = await ensureUnder200KB(baseSharp, size, 'webp');
        fs.writeFileSync(path.join(imagesDir, `${shot.id}-${size}.webp`), webpBuf);

        const avifBuf = await ensureUnder200KB(baseSharp, size, 'avif');
        fs.writeFileSync(path.join(imagesDir, `${shot.id}-${size}.avif`), avifBuf);

        console.log(`  ${shot.id}-${size}: WebP ${(webpBuf.length / 1024).toFixed(1)} KB | AVIF ${(avifBuf.length / 1024).toFixed(1)} KB`);
      }
    }
  }

  // Video poster & captions
  const hero1280 = path.join(imagesDir, 'hero-1280.webp');
  if (fs.existsSync(hero1280)) {
    const posterBuffer = await sharp(hero1280)
      .modulate({ brightness: 0.85 })
      .webp({ quality: 75 })
      .toBuffer();
    fs.writeFileSync(path.join(videosDir, 'gym-reel-poster.webp'), posterBuffer);
    console.log('Saved video poster: gym-reel-poster.webp');
  }

  // Ensure mp4 copy of video exists
  const webmVideo = path.join(videosDir, 'gym-reel.webm');
  const mp4Video = path.join(videosDir, 'gym-reel.mp4');
  if (fs.existsSync(webmVideo) && !fs.existsSync(mp4Video)) {
    fs.copyFileSync(webmVideo, mp4Video);
    console.log('Copied gym-reel.webm to gym-reel.mp4');
  }

  // Write WebVTT captions
  const vttContent = `WEBVTT - Techofay GymOS Workout Experience

00:00:00.000 --> 00:00:04.500
[Upbeat rhythmic gym music plays]
Welcome to elite performance training.

00:00:04.500 --> 00:00:09.000
Every barbell repetition counts toward personal mastery.

00:00:09.000 --> 00:00:15.500
State-of-the-art Olympic platforms, smart biomechanics, and personalized guidance.

00:00:15.500 --> 00:00:22.000
Athletes pushing strength thresholds with dedicated coaches.

00:00:22.000 --> 00:00:30.000
Push your boundaries. Join the elite community today.
`;
  fs.writeFileSync(path.join(videosDir, 'gym-reel.vtt'), vttContent);
  console.log('Saved captions: gym-reel.vtt');

  // Verify all files in imagesDir
  const files = fs.readdirSync(imagesDir);
  console.log(`\n=== IMAGE SIZE AUDIT (${files.length} files) ===`);
  let maxFound = 0;
  for (const f of files) {
    const s = fs.statSync(path.join(imagesDir, f)).size;
    if (s > maxFound) maxFound = s;
    if (s > 200 * 1024) {
      console.error(`VIOLATION: ${f} is ${(s / 1024).toFixed(1)} KB (> 200 KB)`);
    }
  }
  console.log(`Maximum file size found: ${(maxFound / 1024).toFixed(1)} KB (ALL < 200 KB: ${maxFound <= 200 * 1024})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
