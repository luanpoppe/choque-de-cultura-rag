type OnboardingPanoramaProps = {
  text: string;
};

export function OnboardingPanorama({ text }: OnboardingPanoramaProps) {
  return (
    <p className="px-5 pb-2 text-[13px] leading-relaxed text-choque-secondary">
      {text}
    </p>
  );
}
