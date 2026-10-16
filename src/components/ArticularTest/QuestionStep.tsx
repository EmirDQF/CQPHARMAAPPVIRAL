import { playSound } from "@/lib/feedback/sounds";
import type { ScoredQuestion } from "@/lib/types";

interface QuestionStepProps {
  question: ScoredQuestion;
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}

export function QuestionStep({
  question,
  selectedValue,
  onSelect,
}: QuestionStepProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-clinic mb-1">
        {question.helper}
      </legend>
      <p className="text-xl font-semibold mb-5">{question.title}</p>
      <div className="flex flex-col gap-3" role="radiogroup">
        {question.options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                playSound("tap");
                onSelect(option.value);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                isSelected
                  ? "border-brand bg-pastel-mint text-pastel-mint-ink"
                  : "border-line hover:border-brand/50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
