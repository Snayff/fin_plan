import { useEffect, useState } from 'react';
import { Card, CardContent } from './card';

export interface AchievementProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

/**
 * Achievement Component
 * 
 * Displays celebratory animations for user milestones and significant actions.
 * Follows design principle: "Energy on demand" - used sparingly for meaningful moments.
 * 
 * Usage:
 * - First transaction created
 * - Goal reached
 * - Budget milestone
 * - Net worth growth
 */
export function Achievement({
  title,
  description,
  icon,
  show,
  duration = 4000,
  onComplete,
}: AchievementProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-achievement pointer-events-auto">
        <Card className="bg-card border-2 border-primary shadow-2xl max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            {icon && (
              <div className="flex justify-center">
                <div className="text-5xl text-primary">
                  {icon}
                </div>
              </div>
            )}
            <h3 className="text-2xl font-bold text-foreground">{title}</h3>
            {description && (
              <p className="text-text-secondary text-base">{description}</p>
            )}
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-success rounded-full animate-pulse [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Achievement;
