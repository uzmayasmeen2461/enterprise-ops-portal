import { StatusFormatPipe } from './status-format.pipe';

// Pipe tests are the simplest Angular tests — no TestBed needed.
// A pure pipe is just a class with a transform() method.
// We instantiate it directly and call transform() like any other function.
//
// This is exactly like testing a plain TypeScript utility function.

describe('StatusFormatPipe', () => {
  let pipe: StatusFormatPipe;

  beforeEach(() => {
    pipe = new StatusFormatPipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  // ── Core transformation ───────────────────────────────────────────────────

  it('should convert FAILED to Failed', () => {
    expect(pipe.transform('FAILED')).toBe('Failed');
  });

  it('should convert PENDING to Pending', () => {
    expect(pipe.transform('PENDING')).toBe('Pending');
  });

  it('should convert COMPLETED to Completed', () => {
    expect(pipe.transform('COMPLETED')).toBe('Completed');
  });

  it('should convert PROCESSING to Processing', () => {
    expect(pipe.transform('PROCESSING')).toBe('Processing');
  });

  // ── Underscore handling ───────────────────────────────────────────────────

  it('should replace underscores with spaces', () => {
    expect(pipe.transform('PENDING_REVIEW')).toBe('Pending Review');
  });

  it('should handle multiple underscores', () => {
    expect(pipe.transform('HIGH_PRIORITY_TASK')).toBe('High Priority Task');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle already lowercase input', () => {
    expect(pipe.transform('failed')).toBe('Failed');
  });

  it('should handle mixed case input', () => {
    expect(pipe.transform('fAiLeD')).toBe('Failed');
  });
});
