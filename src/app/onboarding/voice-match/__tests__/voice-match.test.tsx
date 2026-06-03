import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';

// ── Module mocks ────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Import the action module AFTER mocking so vi.mocked() works correctly.
// We use dynamic ES import-style mocking via vi.mock factory so path aliases
// are resolved at mock-registration time by Vitest, not at require() time.
vi.mock('@/features/voice/actions/submit-voice-match', () => ({
  getCalibrationRounds: vi.fn(),
  saveCalibrationResults: vi.fn(),
}));

vi.mock('@/features/voice/components/CalibrationRound', () => ({
  CalibrationRound: vi.fn(
    ({
      roundIndex,
      onSelect,
    }: {
      roundIndex: number;
      onSelect: (roundIndex: number, choice: 'A' | 'B') => void;
    }) => (
      <div data-testid="calibration-round">
        <button
          data-testid={`select-a-${roundIndex}`}
          onClick={() => onSelect(roundIndex, 'A')}
        >
          Select A
        </button>
        <button
          data-testid={`select-b-${roundIndex}`}
          onClick={() => onSelect(roundIndex, 'B')}
        >
          Select B
        </button>
      </div>
    ),
  ),
}));

vi.mock('@/features/voice/components/VoiceMatchProgress', () => ({
  VoiceMatchProgress: vi.fn(() => <div data-testid="voice-match-progress" />),
}));

// ── Lazy imports of mocked modules ─────────────────────────────────────────
// These are resolved AFTER vi.mock() hoisting, so vi.mocked() works.
import * as voiceMatchActions from '@/features/voice/actions/submit-voice-match';
import OnboardingVoiceMatchPage from '../page';

// ── Test data ───────────────────────────────────────────────────────────────
const mockRounds = Array.from({ length: 5 }, (_, i) => ({
  round: i + 1,
  dimension: 'warmth',
  calibration_type: 'categorical' as const,
  context: `Scenario ${i + 1}`,
  message_a: `Message A for round ${i + 1}`,
  message_b: `Message B for round ${i + 1}`,
}));

// ── Suite ───────────────────────────────────────────────────────────────────
describe('OnboardingVoiceMatchPage', () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
  });

  it('shows loading state on mount', () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockReturnValue(
      new Promise(() => {}) as ReturnType<typeof voiceMatchActions.getCalibrationRounds>,
    );
    render(<OnboardingVoiceMatchPage />);
    expect(screen.getByText('Preparing calibration rounds...')).toBeDefined();
  });

  it('renders calibration rounds after loading', async () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockResolvedValue({
      rounds: mockRounds,
    } as Awaited<ReturnType<typeof voiceMatchActions.getCalibrationRounds>>);

    render(<OnboardingVoiceMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Round 1 of 5')).toBeDefined();
    });
  });

  it('shows continue button after all rounds completed', async () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockResolvedValue({
      rounds: mockRounds,
    } as Awaited<ReturnType<typeof voiceMatchActions.getCalibrationRounds>>);

    render(<OnboardingVoiceMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Round 1 of 5')).toBeDefined();
    });

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => {
        expect(screen.getByTestId(`select-a-${i}`)).toBeDefined();
      });
      // eslint-disable-next-line no-await-in-loop
      fireEvent.click(screen.getByTestId(`select-a-${i}`));
    }

    await waitFor(() => {
      expect(screen.getByText('Continue to review')).toBeDefined();
    });
  });

  it('submits and navigates to review on finish', async () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockResolvedValue({
      rounds: mockRounds,
    } as Awaited<ReturnType<typeof voiceMatchActions.getCalibrationRounds>>);
    vi.mocked(voiceMatchActions.saveCalibrationResults).mockResolvedValue(
      {} as Awaited<ReturnType<typeof voiceMatchActions.saveCalibrationResults>>,
    );

    render(<OnboardingVoiceMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Round 1 of 5')).toBeDefined();
    });

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => {
        expect(screen.getByTestId(`select-a-${i}`)).toBeDefined();
      });
      // eslint-disable-next-line no-await-in-loop
      fireEvent.click(screen.getByTestId(`select-a-${i}`));
    }

    const continueBtn = await screen.findByText('Continue to review');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(voiceMatchActions.saveCalibrationResults).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/review');
    });
  });

  it('shows error message on submission failure', async () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockResolvedValue({
      rounds: mockRounds,
    } as Awaited<ReturnType<typeof voiceMatchActions.getCalibrationRounds>>);
    vi.mocked(voiceMatchActions.saveCalibrationResults).mockResolvedValue({
      error: 'Failed to save',
    } as Awaited<ReturnType<typeof voiceMatchActions.saveCalibrationResults>>);

    render(<OnboardingVoiceMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Round 1 of 5')).toBeDefined();
    });

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => {
        expect(screen.getByTestId(`select-a-${i}`)).toBeDefined();
      });
      // eslint-disable-next-line no-await-in-loop
      fireEvent.click(screen.getByTestId(`select-a-${i}`));
    }

    const continueBtn = await screen.findByText('Continue to review');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to save')).toBeDefined();
    });
  });

  it('shows error state when getCalibrationRounds fails', async () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockResolvedValue({
      error: 'Network error',
    } as Awaited<ReturnType<typeof voiceMatchActions.getCalibrationRounds>>);

    render(<OnboardingVoiceMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });

    expect(screen.getByText('Try again')).toBeDefined();
  });

  it('handles server error during submission', async () => {
    vi.mocked(voiceMatchActions.getCalibrationRounds).mockResolvedValue({
      rounds: mockRounds,
    } as Awaited<ReturnType<typeof voiceMatchActions.getCalibrationRounds>>);
    vi.mocked(voiceMatchActions.saveCalibrationResults).mockRejectedValue(
      new Error('Server error'),
    );

    render(<OnboardingVoiceMatchPage />);

    await waitFor(() => {
      expect(screen.getByText('Round 1 of 5')).toBeDefined();
    });

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => {
        expect(screen.getByTestId(`select-a-${i}`)).toBeDefined();
      });
      // eslint-disable-next-line no-await-in-loop
      fireEvent.click(screen.getByTestId(`select-a-${i}`));
    }

    const continueBtn = await screen.findByText('Continue to review');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeDefined();
    });
  });
});
