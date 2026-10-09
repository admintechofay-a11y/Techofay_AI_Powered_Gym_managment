export interface GymImageMeta {
  id: string;
  name: string;
  alt: string;
  focalPoint: string;
  photographer: string;
  sourceUrl: string;
  license: string;
  category: 'gym' | 'marketing' | 'amenity' | 'texture';
  sources: {
    webp: {
      640: string;
      1280: string;
      1920: string;
    };
    avif: {
      640: string;
      1280: string;
      1920: string;
    };
  };
  defaultSrc: string;
}

export const GYM_IMAGES: Record<string, GymImageMeta> = {
  hero: {
    id: 'hero',
    name: 'Hero Athlete Strength',
    alt: 'Elite athlete performing focused dumbbell strength training in dramatic moody lighting',
    focalPoint: 'right center',
    photographer: 'Arthur Edelmans',
    sourceUrl: 'https://unsplash.com/photos/man-holding-dumbbell-50MIe52ZCK8',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/hero-640.webp',
        1280: '/images/hero-1280.webp',
        1920: '/images/hero-1920.webp',
      },
      avif: {
        640: '/images/hero-640.avif',
        1280: '/images/hero-1280.avif',
        1920: '/images/hero-1920.avif',
      },
    },
    defaultSrc: '/images/hero-1280.webp',
  },
  freeWeights: {
    id: 'free-weights',
    name: 'Free Weights & Strength Floor',
    alt: 'Heavy iron dumbbell sets and Olympic barbell strength training zone',
    focalPoint: 'center',
    photographer: 'Victor Freitas',
    sourceUrl: 'https://unsplash.com/photos/row-of-dumbbells-qZ-KDhpSkwE',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/free-weights-640.webp',
        1280: '/images/free-weights-1280.webp',
        1920: '/images/free-weights-1920.webp',
      },
      avif: {
        640: '/images/free-weights-640.avif',
        1280: '/images/free-weights-1280.avif',
        1920: '/images/free-weights-1920.avif',
      },
    },
    defaultSrc: '/images/free-weights-1280.webp',
  },
  cardio: {
    id: 'cardio',
    name: 'Cardio Zone',
    alt: 'Modern cardio zone with smart console treadmills and cycle ergometers',
    focalPoint: 'center',
    photographer: 'Jonathan Borba',
    sourceUrl: 'https://unsplash.com/photos/woman-running-on-treadmill-ZF_45jkmP1k',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/cardio-640.webp',
        1280: '/images/cardio-1280.webp',
        1920: '/images/cardio-1920.webp',
      },
      avif: {
        640: '/images/cardio-640.avif',
        1280: '/images/cardio-1280.avif',
        1920: '/images/cardio-1920.avif',
      },
    },
    defaultSrc: '/images/cardio-1280.webp',
  },
  groupClass: {
    id: 'group-class',
    name: 'Group HIIT & Functional Class',
    alt: 'High-energy group HIIT fitness session with certified instructors',
    focalPoint: 'center',
    photographer: 'Geert Pieters',
    sourceUrl: 'https://unsplash.com/photos/group-of-people-exercising-in-gym-3RnkZpDxoqY',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/group-class-640.webp',
        1280: '/images/group-class-1280.webp',
        1920: '/images/group-class-1920.webp',
      },
      avif: {
        640: '/images/group-class-640.avif',
        1280: '/images/group-class-1280.avif',
        1920: '/images/group-class-1920.avif',
      },
    },
    defaultSrc: '/images/group-class-1280.webp',
  },
  personalTrainer: {
    id: 'personal-trainer',
    name: 'Personal Trainer Coaching',
    alt: 'Certified personal trainer coaching a client on proper barbell movement form',
    focalPoint: 'center',
    photographer: 'Cesar Galeão',
    sourceUrl: 'https://unsplash.com/photos/trainer-guiding-client-YTRwA7c1e5k',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/personal-trainer-640.webp',
        1280: '/images/personal-trainer-1280.webp',
        1920: '/images/personal-trainer-1920.webp',
      },
      avif: {
        640: '/images/personal-trainer-640.avif',
        1280: '/images/personal-trainer-1280.avif',
        1920: '/images/personal-trainer-1920.avif',
      },
    },
    defaultSrc: '/images/personal-trainer-1280.webp',
  },
  boxing: {
    id: 'boxing',
    name: 'Boxing & Combat Arena',
    alt: 'Functional boxing arena with leather heavy bags and conditioning turf',
    focalPoint: 'center',
    photographer: 'Attila Hercgh',
    sourceUrl: 'https://unsplash.com/photos/boxing-heavy-bags-in-gym-N_P4Kj4R5_s',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/boxing-640.webp',
        1280: '/images/boxing-1280.webp',
        1920: '/images/boxing-1920.webp',
      },
      avif: {
        640: '/images/boxing-640.avif',
        1280: '/images/boxing-1280.avif',
        1920: '/images/boxing-1920.avif',
      },
    },
    defaultSrc: '/images/boxing-1280.webp',
  },
  lockerRoom: {
    id: 'locker-room',
    name: 'Executive Locker Rooms & Amenities',
    alt: 'Immaculate executive locker rooms with digital keyless lockers and private showers',
    focalPoint: 'center',
    photographer: 'Sanibell',
    sourceUrl: 'https://unsplash.com/photos/modern-clean-locker-facility-u_4Wc0y1RzQ',
    license: 'Unsplash Free Commercial License',
    category: 'amenity',
    sources: {
      webp: {
        640: '/images/locker-room-640.webp',
        1280: '/images/locker-room-1280.webp',
        1920: '/images/locker-room-1920.webp',
      },
      avif: {
        640: '/images/locker-room-640.avif',
        1280: '/images/locker-room-1280.avif',
        1920: '/images/locker-room-1920.avif',
      },
    },
    defaultSrc: '/images/locker-room-1280.webp',
  },
  reception: {
    id: 'reception',
    name: 'Reception & Access Control Desk',
    alt: 'Sleek gym reception counter equipped with contactless turnstile check-in',
    focalPoint: 'center',
    photographer: 'Proxyclick',
    sourceUrl: 'https://unsplash.com/photos/modern-reception-lobby-counter-8b_G3FqX4sA',
    license: 'Unsplash Free Commercial License',
    category: 'amenity',
    sources: {
      webp: {
        640: '/images/reception-640.webp',
        1280: '/images/reception-1280.webp',
        1920: '/images/reception-1920.webp',
      },
      avif: {
        640: '/images/reception-640.avif',
        1280: '/images/reception-1280.avif',
        1920: '/images/reception-1920.avif',
      },
    },
    defaultSrc: '/images/reception-1280.webp',
  },
  nutrition: {
    id: 'nutrition',
    name: 'Nutrition & Meal Prep',
    alt: 'Macro-balanced high-protein fitness meal prep designed for optimal muscle recovery',
    focalPoint: 'center',
    photographer: 'Eiliv Aceron',
    sourceUrl: 'https://unsplash.com/photos/healthy-protein-salad-bowl-ZuIDLSz3Bgk',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/nutrition-640.webp',
        1280: '/images/nutrition-1280.webp',
        1920: '/images/nutrition-1920.webp',
      },
      avif: {
        640: '/images/nutrition-640.avif',
        1280: '/images/nutrition-1280.avif',
        1920: '/images/nutrition-1920.avif',
      },
    },
    defaultSrc: '/images/nutrition-1280.webp',
  },
  bodyMeasurement: {
    id: 'body-measurement',
    name: 'Body Composition & Biometrics',
    alt: 'Biometric body composition analysis and circumference progress tracking',
    focalPoint: 'center',
    photographer: 'National Cancer Institute',
    sourceUrl: 'https://unsplash.com/photos/medical-fitness-assessment-consultation-E330GS_w8zM',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/body-measurement-640.webp',
        1280: '/images/body-measurement-1280.webp',
        1920: '/images/body-measurement-1920.webp',
      },
      avif: {
        640: '/images/body-measurement-640.avif',
        1280: '/images/body-measurement-1280.avif',
        1920: '/images/body-measurement-1920.avif',
      },
    },
    defaultSrc: '/images/body-measurement-1280.webp',
  },
  stretchingRecovery: {
    id: 'stretching-recovery',
    name: 'Recovery & Mobility Zone',
    alt: 'Dedicated recovery lounge with yoga mats, mobility rollers, and stretch bands',
    focalPoint: 'center',
    photographer: 'Dylan Gillis',
    sourceUrl: 'https://unsplash.com/photos/athlete-stretching-on-mat-KdeqA3aTnBY',
    license: 'Unsplash Free Commercial License',
    category: 'gym',
    sources: {
      webp: {
        640: '/images/stretching-recovery-640.webp',
        1280: '/images/stretching-recovery-1280.webp',
        1920: '/images/stretching-recovery-1920.webp',
      },
      avif: {
        640: '/images/stretching-recovery-640.avif',
        1280: '/images/stretching-recovery-1280.avif',
        1920: '/images/stretching-recovery-1920.avif',
      },
    },
    defaultSrc: '/images/stretching-recovery-1280.webp',
  },
  textureDark: {
    id: 'texture-dark',
    name: 'Dark Matte Texture Background',
    alt: 'Abstract dark slate gym texture background for contrast panels',
    focalPoint: 'center',
    photographer: 'Patrick Hendry',
    sourceUrl: 'https://unsplash.com/photos/dark-textured-surface-background-w8Y9u1m0r9Y',
    license: 'Unsplash Free Commercial License',
    category: 'texture',
    sources: {
      webp: {
        640: '/images/texture-dark-640.webp',
        1280: '/images/texture-dark-1280.webp',
        1920: '/images/texture-dark-1920.webp',
      },
      avif: {
        640: '/images/texture-dark-640.avif',
        1280: '/images/texture-dark-1280.avif',
        1920: '/images/texture-dark-1920.avif',
      },
    },
    defaultSrc: '/images/texture-dark-1280.webp',
  },
  saasOwnerTablet: {
    id: 'saas-owner-tablet',
    name: 'Gym Owner Dashboard Management',
    alt: 'Gym owner reviewing live member check-ins and revenue analytics on a digital tablet',
    focalPoint: 'center',
    photographer: 'Blake Wisz',
    sourceUrl: 'https://unsplash.com/photos/person-holding-black-ipad-g1Kr4Ozfoac',
    license: 'Unsplash Free Commercial License',
    category: 'marketing',
    sources: {
      webp: {
        640: '/images/saas-owner-tablet-640.webp',
        1280: '/images/saas-owner-tablet-1280.webp',
        1920: '/images/saas-owner-tablet-1920.webp',
      },
      avif: {
        640: '/images/saas-owner-tablet-640.avif',
        1280: '/images/saas-owner-tablet-1280.avif',
        1920: '/images/saas-owner-tablet-1920.avif',
      },
    },
    defaultSrc: '/images/saas-owner-tablet-1280.webp',
  },
};

export const GYM_VIDEO = {
  id: 'gym-reel',
  title: 'Olympic Weightlifting & Strength Training Session',
  poster: '/videos/gym-reel-poster.webp',
  sources: [
    { src: '/videos/gym-reel.webm', type: 'video/webm' },
    { src: '/videos/gym-reel.mp4', type: 'video/mp4' },
  ],
  captions: '/videos/gym-reel.vtt',
  credit: {
    title: 'Dragoon Week Weightlifting Competition',
    author: 'US Army / DVIDS / Wikimedia Commons',
    license: 'Public Domain / CC0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dragoon_Week_2025_Weightlifting_Competition_(963715).webm',
  },
};
