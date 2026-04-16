import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

export interface LLMOptions {
  geminiKey?: string;
  openRouterKey?: string;
  useOpenRouter?: boolean;
  model?: string;
}

export async function generateContent(prompt: string, options: LLMOptions): Promise<string> {
  if (options.useOpenRouter && options.openRouterKey) {
    logger.info("Calling OpenRouter API", { model: options.model });
    try {
      const response = await fetch("/api/llm/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: options.openRouterKey,
          messages: [{ role: "user", content: prompt }],
          model: options.model || "google/gemini-2.0-flash-001",
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "OpenRouter error");
      return data.choices[0].message.content;
    } catch (error) {
      logger.error("OpenRouter call failed", error);
      throw error;
    }
  }

  // Default to Gemini
  const key = options.geminiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    logger.error("No Gemini API key found");
    throw new Error("API key missing. Please provide one in settings.");
  }

  logger.info("Calling Gemini API", { promptLength: prompt.length });
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const text = response.text || "";
    logger.info("Gemini response received", { responseLength: text.length, preview: text.substring(0, 100) + "..." });
    return text;
  } catch (error) {
    logger.error("Gemini call failed", error);
    throw error;
  }
}

export const LESSON_PROMPT = (topic: string, profile?: any) => `
Ты — мудрый Сказочник, который помогает детям подготовиться к школе.
Создай интерактивный план урока на тему "${topic}" для ребенка дошкольника (подготовка к 1 классу по стандартам РФ).

${profile ? `Данные ученика: Имя: ${profile.name}, Возраст: ${profile.age}, Пол: ${profile.gender}, Целевой уровень: ${profile.targetLevel}, Интересы: ${profile.interests?.join(', ')}.` : ''}
${profile?.readinessAssessment ? `Результаты начальной диагностики: ${JSON.stringify(profile.readinessAssessment)}` : ''}

Урок должен быть построен как СКАЗОЧНОЕ ПУТЕШЕСТВИЕ и включать:
1. **Заголовок**: Красочное название главы сказки.
2. **Вступление**: Сказочник приветствует ребенка и вводит в сюжет, используя его интересы (${profile?.interests?.join(', ') || 'сказки'}).
3. **План для родителя**: Четкие инструкции для взрослого, как вести урок.
4. **Интерактивные вставки**: Конкретные упражнения, игры или вопросы, которые родитель задает ребенку.
5. **Объяснения для ребенка**: Простые и понятные слова, которые родитель может прочитать вслух.
6. **Персонажи**: Используй персонажа-ребенка (по имени ${profile?.name || 'Малыш'}) и других сказочных помощников.
7. **Изображения**: Вставляй теги [IMAGE: ключевое_слово] для визуализации сюжета.
8. **Главный вывод**: Мудрость от сказочного персонажа в конце.
9. **JSON Блок**: Чек-лист для родителя (3-5 пунктов).

Форматируй блок JSON строго так:
\`\`\`json
{
  "parentChecklist": [
    {
      "task": "Название задачи",
      "description": "Как проверить умение"
    }
  ]
}
\`\`\`

Тон: добрый, игровой, вовлекающий. Весь процесс обучения — это помощь героям сказки через освоение знаний (буквы, цифры, логика).
`;

export const READINESS_TEST_PROMPT = `
Создай комплексный тест-опросник для родителя, чтобы определить уровень готовности ребенка к 1 классу (по стандартам РФ).
Тест должен охватывать:
1. Математические представления.
2. Речевое развитие и чтение.
3. Окружающий мир.
4. Мелкая моторика.
5. Логика и внимание.

Верни JSON объект:
{
  "categories": [
    {
      "id": "math",
      "title": "Математика",
      "questions": [
        {
          "id": "q1",
          "text": "Умеет ли ребенок считать до 10 и обратно?",
          "options": ["Нет", "С трудом", "Уверенно"]
        }
      ]
    }
  ]
}
`;

export const ANALYZE_READINESS_PROMPT = (results: any, profile: any) => `
На основе результатов диагностики готовности ребенка к школе:
${JSON.stringify(results)}

Целевой уровень: ${profile.targetLevel}
Интересы: ${profile.interests?.join(', ')}

Сформируй адаптированный промпт для генерации учебного плана. 
План должен фокусироваться на слабых сторонах, выявленных в диагностике, стремиться к целевому уровню и использовать интересы ребенка для мотивации.
ВАЖНО: Твой ответ должен содержать ТОЛЬКО текст промпта, описывающий темы и цели обучения. 
НЕ ВКЛЮЧАЙ инструкции по формату JSON, они будут добавлены автоматически.
`;

export const ANALYZE_PROGRESS_PROMPT = (progress: any, lessons: any) => `
На основе текущего прогресса ребенка:
Прогресс: ${JSON.stringify(progress)}
Список уроков: ${JSON.stringify(lessons)}

Сформируй прогноз обучения и персональные рекомендации.
Верни строго JSON объект:
{
  "forecast": [
    {
      "category": "Математика",
      "prediction": "Ожидаемое освоение счета до 20 через 3 урока.",
      "progress": 65
    }
  ],
  "recommendations": [
    "Больше игровых пауз между уроками.",
    "Повторение гласных перед сном."
  ]
}
`;
