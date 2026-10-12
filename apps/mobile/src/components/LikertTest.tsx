/**
 * Una afirmación por pantalla con cinco respuestas; avanza sola al elegir.
 * Valores de cada opción configurables (carácter: −1…1; corazón: 0…4).
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Eyebrow, Progress, Screen, Stack } from '@/components/ui';
import { color, radius, space, type } from '@/theme';

export interface LikertOption {
  label: string;
  value: number;
}

export function LikertTest({
  questions,
  options,
  onDone,
  header,
  progressLabel,
  backLabel,
  finishLabel,
}: {
  questions: { code: string; text: string }[];
  options: LikertOption[];
  onDone: (answers: number[]) => void;
  header?: ReactNode;
  progressLabel: (n: number, total: number) => string;
  backLabel: string;
  finishLabel: string;
}) {
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = questions[i];
  const last = i === questions.length - 1;
  const done = answers.length === questions.length && answers.every((a) => a !== undefined);

  const choose = (v: number) => {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
    if (timer.current) clearTimeout(timer.current);
    if (!last) timer.current = setTimeout(() => setI((x) => x + 1), 220);
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space.s }}>
          {last && done ? <Button label={finishLabel} onPress={() => onDone(answers as number[])} /> : null}
          {i > 0 ? <Button variant="ghost" label={backLabel} onPress={() => setI(i - 1)} /> : null}
        </View>
      }>
      {header}
      <Stack gap={space.s}>
        <Eyebrow>{progressLabel(i + 1, questions.length)}</Eyebrow>
        <Progress value={(i + 1) / questions.length} />
      </Stack>
      <Text style={[type.h2, { color: color.azulProfundo, marginVertical: space.l }]}>{q.text}</Text>
      <View style={{ gap: space.s }} accessibilityRole="radiogroup">
        {options.map((o) => {
          const selected = answers[i] === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => choose(o.value)}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: radius.m,
                borderWidth: 1,
                borderColor: selected ? color.azulProfundo : color.piedra,
                backgroundColor: selected ? color.azulProfundo : pressed ? color.niebla : color.blanco,
                justifyContent: 'center',
                paddingHorizontal: space.m,
              })}>
              <Text style={[type.bodyStrong, { color: selected ? color.blanco : color.azulProfundo }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
