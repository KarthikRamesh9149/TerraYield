/**
 * HealthScore Value Object
 * Immutable representation of a health score (0-100) with categorization
 */

export type ScoreLevel = 'critical' | 'warning' | 'good';

export interface HealthScoreData {
  value: number;
  level: ScoreLevel;
}

export class HealthScore {
  private readonly _value: number;
  private readonly _level: ScoreLevel;

  private constructor(value: number) {
    this._value = Math.round(Math.max(0, Math.min(100, value)));
    this._level = HealthScore.determineLevel(this._value);
  }

  static create(value: number): HealthScore {
    return new HealthScore(value);
  }

  static fromPercentage(percentage: number): HealthScore {
    return new HealthScore(percentage);
  }

  private static determineLevel(value: number): ScoreLevel {
    if (value < 40) return 'critical';
    if (value < 70) return 'warning';
    return 'good';
  }

  get value(): number {
    return this._value;
  }

  get level(): ScoreLevel {
    return this._level;
  }

  get isCritical(): boolean {
    return this._level === 'critical';
  }

  get isWarning(): boolean {
    return this._level === 'warning';
  }

  get isGood(): boolean {
    return this._level === 'good';
  }

  toJSON(): HealthScoreData {
    return {
      value: this._value,
      level: this._level,
    };
  }

  toString(): string {
    return `${this._value}/100 (${this._level})`;
  }
}

export interface DistrictScores {
  soil: HealthScore;
  water: HealthScore;
  climate: HealthScore;
  crop: HealthScore;
  overall: HealthScore;
}

export interface DistrictScoresData {
  soil: HealthScoreData;
  water: HealthScoreData;
  climate: HealthScoreData;
  crop: HealthScoreData;
  overall: HealthScoreData;
}
