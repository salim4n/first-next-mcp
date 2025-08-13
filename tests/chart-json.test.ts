import { describe, it, expect } from 'vitest';
import { extractAndRemoveChartJsonBlocks, isChartPayload, type AssistantRichContent } from '@/lib/chat/chart-json';

describe('chart-json helpers', () => {
  it('detects and extracts a fenced pie chart JSON block', () => {
    const text = [
      'Here is the chart:',
      '```json',
      '{"type":"pie-chart","title":"Répartition","data":{"labels":["A","B"],"values":[3,7]}}',
      '```',
      'Thanks.'
    ].join('\n');

    const result = extractAndRemoveChartJsonBlocks(text);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.cleanedText).toContain('Here is the chart:');
    expect(result.cleanedText).toContain('Thanks.');
    expect(result.cleanedText).not.toContain('```json');
    expect(result.cleanedText).not.toContain('pie-chart');

    expect(result.charts.length).toBe(1);
    const chart = result.charts[0] as AssistantRichContent;
    expect(chart.type).toBe('pie-chart');
    if (chart.type === 'pie-chart') {
      expect(chart.data.labels).toEqual(['A','B']);
      expect(chart.data.values).toEqual([3,7]);
    }
  });

  it('detects and extracts an inline bar chart JSON line', () => {
    const text = 'Before line\n{"type":"bar-chart","data":{"labels":["X","Y"],"values":[1,2]}}\nAfter line';
    const result = extractAndRemoveChartJsonBlocks(text);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.cleanedText).toContain('Before line');
    expect(result.cleanedText).toContain('After line');
    expect(result.cleanedText).not.toContain('bar-chart');

    expect(result.charts.length).toBe(1);
    const chart = result.charts[0];
    expect(isChartPayload(chart)).toBe(true);
    if (chart.type === 'bar-chart') {
      expect(chart.data.labels).toEqual(['X','Y']);
      expect(chart.data.values).toEqual([1,2]);
    }
  });

  it('returns null for text without chart JSON', () => {
    const text = 'Just some markdown and text without any JSON.';
    const result = extractAndRemoveChartJsonBlocks(text);
    expect(result).toBeNull();
  });
});
