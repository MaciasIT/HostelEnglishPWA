import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@testing-library/jest-dom';

describe('App', () => {
  it('should render the main application without crashing', () => {
    render(<App />);
    // As a smoke test, we'll just check if some basic text from the App is present.
    // For now, we'll look for the text 'HostelEnglish' which is likely to be in the app.
    expect(screen.getByRole('heading', { name: /HostellinglésApp/i, level: 1 })).toBeInTheDocument();
  });
});
