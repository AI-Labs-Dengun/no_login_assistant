declare module 'react-typewriter-effect' {
  interface TypewriterEffectProps {
    text: string;
    cursorColor?: string;
    textColor?: string;
    startDelay?: number;
    typeSpeed?: number;
  }

  const TypewriterEffect: React.FC<TypewriterEffectProps>;
  export default TypewriterEffect;
} 