import { useState, useCallback } from 'react';
import clsx from 'clsx';
import './ConfigScreen.css';

const DIFFICULTY_LEVELS = [
  { key: 'beginner', label: 'Beginner', icon: 'sentiment_satisfied', description: 'Basic questions to get started' },
  { key: 'intermediate', label: 'Intermediate', icon: 'trending_up', description: 'Balanced mix of levels' },
  { key: 'advanced', label: 'Advanced', icon: 'psychology', description: 'For those who master the topic' },
  { key: 'master', label: 'Master', icon: 'military_tech', description: 'Maximum challenge' },
];

function ConfigScreen({ settings, setSettings, totalAvailable, onStart }) {
  const maxQuestions = Math.min(totalAvailable, 50);
  
  // Calculate percentage for slider track background
  const sliderPercentage = ((settings.numQuestions - 1) / (maxQuestions - 1)) * 100;

  const handleSliderChange = useCallback(
    (e) => {
      setSettings((prev) => ({
        ...prev,
        numQuestions: Number(e.target.value),
      }));
    },
    [setSettings]
  );

  const toggleTimer = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      timerEnabled: !prev.timerEnabled,
    }));
  }, [setSettings]);

  const toggleFeedback = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      immediateFeedback: !prev.immediateFeedback,
    }));
  }, [setSettings]);

  const setTimerDuration = useCallback(
    (seconds) => {
      setSettings((prev) => ({
        ...prev,
        timerDurationSeconds: seconds,
      }));
    },
    [setSettings]
  );

  const setDifficulty = useCallback(
    (level) => {
      setSettings((prev) => ({
        ...prev,
        difficultyLevel: level,
      }));
    },
    [setSettings]
  );

  return (
    <div className="config-screen">
      {/* Header */}
      <div className="config-header">
        <h1 className="config-title">Passive Voice Quiz</h1>
        <p className="config-subtitle">
          Configure your session to test your knowledge.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="config-card animate-fade-in-up">
        <div className="config-card-inner">
          {/* Difficulty Level Selector */}
          <div className="config-section">
            <label className="config-label">Difficulty Level</label>
            <div className="difficulty-grid">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.key}
                  className={clsx(
                    'difficulty-card',
                    settings.difficultyLevel === level.key && 'difficulty-active'
                  )}
                  onClick={() => setDifficulty(level.key)}
                >
                  <span className="material-symbols-outlined difficulty-icon">
                    {level.icon}
                  </span>
                  <div className="difficulty-text">
                    <span className="difficulty-label">{level.label}</span>
                    <span className="difficulty-desc">{level.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Questions Slider */}
          <div className="config-section">
            <div className="slider-header">
              <label className="config-label" htmlFor="question-slider">
                Number of Questions
              </label>
              <span className="slider-value">{settings.numQuestions}</span>
            </div>
            <div className="slider-wrapper">
              <input
                id="question-slider"
                type="range"
                min={1}
                max={maxQuestions}
                step={1}
                value={settings.numQuestions}
                onChange={handleSliderChange}
                className="custom-slider"
                style={{ '--slider-progress': `${sliderPercentage}%` }}
              />
              <div className="slider-labels">
                <span>1 Question</span>
                <span>{maxQuestions} Questions</span>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="toggle-grid">
            {/* Timer Toggle */}
            <div
              className={clsx('toggle-card', settings.timerEnabled && 'active')}
              onClick={toggleTimer}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleTimer()}
            >
              <div className="toggle-card-top">
                <span className="material-symbols-outlined toggle-icon">timer</span>
                <div
                  className={clsx('toggle-switch', settings.timerEnabled && 'on')}
                  role="switch"
                  aria-checked={settings.timerEnabled}
                >
                  <div className="toggle-thumb" />
                </div>
              </div>
              <div className="toggle-card-content">
                <h3 className="toggle-title">Time Limit</h3>
                <p className="toggle-description">
                  {settings.timerDurationSeconds} seconds per question.
                </p>
              </div>

              {settings.timerEnabled && (
                <div className="timer-options" onClick={(e) => e.stopPropagation()}>
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      className={clsx(
                        'timer-option',
                        settings.timerDurationSeconds === sec && 'selected'
                      )}
                      onClick={() => setTimerDuration(sec)}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback Toggle */}
            <div
              className={clsx('toggle-card', settings.immediateFeedback && 'active')}
              onClick={toggleFeedback}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleFeedback()}
            >
              <div className="toggle-card-top">
                <span className="material-symbols-outlined toggle-icon">
                  psychology_alt
                </span>
                <div
                  className={clsx('toggle-switch', settings.immediateFeedback && 'on')}
                  role="switch"
                  aria-checked={settings.immediateFeedback}
                >
                  <div className="toggle-thumb" />
                </div>
              </div>
              <div className="toggle-card-content">
                <h3 className="toggle-title">Immediate Feedback</h3>
                <p className="toggle-description">
                  See detailed justification right after confirming.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="config-cta">
            <button className="btn-start" onClick={onStart} id="start-quiz-btn">
              Start Quiz
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="config-branding">ENGLISH - 3ºFINTECH</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigScreen;
