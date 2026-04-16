import { Lesson } from "./types";

export const initialLessons: Lesson[] = [
  {
    id: "intro-1",
    title: "О себе и семье",
    description: "Учимся называть свое имя, адрес и имена родителей.",
    order: 1,
    status: "available",
    xpReward: 100,
    difficulty: 'easy',
  },
  {
    id: "reading-1",
    title: "Мир звуков и букв",
    description: "Знакомство с гласными звуками и буквами А, О, У, Ы, Э.",
    order: 2,
    status: "available",
    xpReward: 100,
    difficulty: 'easy',
  },
  {
    id: "math-1",
    title: "Веселый счет до 10",
    description: "Учимся считать предметы в прямом и обратном порядке.",
    order: 3,
    status: "available",
    xpReward: 100,
    difficulty: 'easy',
  },
  {
    id: "logic-1",
    title: "Логические тропинки",
    description: "Сравнение предметов, поиск лишнего и обобщение.",
    order: 4,
    status: "available",
    xpReward: 150,
    difficulty: 'medium',
  },
  {
    id: "world-1",
    title: "Времена года",
    description: "Изучаем признаки сезонов, названия месяцев и дней недели.",
    order: 5,
    status: "available",
    xpReward: 150,
    difficulty: 'medium',
  },
  {
    id: "writing-1",
    title: "Послушные пальчики",
    description: "Штриховка, обводка и подготовка руки к письму.",
    order: 6,
    status: "available",
    xpReward: 200,
    difficulty: 'hard',
  }
];
