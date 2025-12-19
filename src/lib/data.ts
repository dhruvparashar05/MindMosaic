import { PlaceHolderImages } from './placeholder-images';

export const getPlaceholderImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id);

export const professionals = [
  {
    id: '1',
    name: 'Dr. Emily Carter',
    specialty: 'Cognitive Behavioral Therapy',
    avatar: getPlaceholderImage('professional-1'),
  },
  {
    id: '2',
    name: 'Dr. Ben Adams',
    specialty: 'Mindfulness & Stress Reduction',
    avatar: getPlaceholderImage('professional-2'),
  },
  {
    id: '3',
    name: 'Dr. Sarah Lee',
    specialty: 'Relationship Counseling',
    avatar: getPlaceholderImage('professional-3'),
  },
];

export const resources = [
  {
    id: '1',
    title: 'Mindfulness Meditation 101',
    description:
      'Learn the basics of mindfulness meditation and start your journey towards a calmer mind.',
    image: getPlaceholderImage('resource-1'),
    duration: '15 min',
    url: 'https://youtu.be/aIIEI33EUqI?si=TtAsXkPNrEvMvY2m',
  },
  {
    id: '2',
    title: 'Intro to CBT',
    description:
      'Discover how Cognitive Behavioral Therapy can help you reframe negative thoughts.',
    image: getPlaceholderImage('resource-2'),
    duration: '5 min',
    url: 'https://youtu.be/ZdyOwZ4_RnI?si=wMPrb4vJj9VXhCY-',
  },
  {
    id: '3',
    title: 'Coping with Anxiety',
    description: 'Practical techniques to manage and reduce anxiety in your daily life.',
    image: getPlaceholderImage('resource-3'),
    duration: '15 min',
    url: 'https://youtu.be/WWloIAQpMcQ?si=LSAXLjG4gwWtcuXz',
  },
  {
    id: '4',
    title: 'The Science of Better Sleep',
    description: 'Improve your sleep hygiene and unlock the restorative power of sleep.',
    image: getPlaceholderImage('resource-4'),
    duration: '4 min',
    url: 'https://youtu.be/eM2VWspRpfk?si=A17hdGW2qGWbW0R5',
  },
  {
    id: '5',
    title: 'Nutrition for Mental Well-being',
    description: 'Explore the connection between what you eat and how you feel.',
    image: getPlaceholderImage('resource-5'),
    duration: '30 min',
    url: '#',
  },
  {
    id: '6',
    title: 'Building Emotional Resilience',
    description: 'Develop the skills to bounce back from adversity and challenges.',
    image: getPlaceholderImage('resource-6'),
    duration: '20 min',
    url: '#',
  },
];

export const journalEntries = [
  {
    id: '1',
    title: 'A Moment of Peace',
    date: '2024-07-20',
    content:
      'Today, I took a walk in the park and felt a sense of calm I haven’t felt in a while. The sun was warm, and the birds were singing. It was a simple, yet profound moment of peace.',
    isPublished: true,
  },
  {
    id: '2',
    title: 'Feeling Overwhelmed',
    date: '2024-07-18',
    content:
      'Work has been really stressful lately. I feel like I have a million things to do and not enough time. I need to remember to take breaks and breathe.',
    isPublished: false,
  },
  {
    id: '3',
    title: 'A Small Victory',
    date: '2024-07-15',
    content:
      'I finally finished the project that has been causing me so much stress. It feels like a huge weight has been lifted off my shoulders. Proud of myself for pushing through.',
    isPublished: true,
  },
];

export const moodData = [
  { date: 'Jul 15', mood: 'Happy' },
  { date: 'Jul 16', mood: 'Neutral' },
  { date: 'Jul 17', mood: 'Anxious' },
  { date: 'Jul 18', mood: 'Sad' },
  { date: 'Jul 19', mood: 'Neutral' },
  { date: 'Jul 20', mood: 'Happy' },
  { date: 'Jul 21', mood: 'Happy' },
];

export const getMoodScore = (mood: string) => {
  switch (mood) {
    case 'Happy':
      return 5;
    case 'Neutral':
      return 3;
    case 'Sad':
      return 2;
    case 'Anxious':
      return 1;
    case 'Angry':
      return 1;
    default:
      return 0;
  }
};

export const moodChartData = moodData.map((d) => ({
  date: d.date,
  mood: getMoodScore(d.mood),
}));
