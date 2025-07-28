# Grand Prix Events Fetcher

This script automatically fetches the list of Formula 1 Grand Prix events from the FIA website and updates the configuration with new race IDs.

## Usage

### Production Mode
```bash
# Fetch events from FIA website and update config
bun run fetch-events
```

### Test Mode
```bash
# Test the parsing logic with sample data
bun run fetch-events:test
```

## How It Works

1. **Fetches HTML Content**: Downloads the Grand Prix events page from the FIA website
2. **Parses Event Data**: Extracts event IDs and names using multiple parsing strategies:
   - HTML link elements with event URLs
   - Data attributes containing event IDs
   - JavaScript objects and arrays with event information
3. **Updates Configuration**: Adds new event IDs to `src/config.json` while preserving existing data
4. **Graceful Error Handling**: Falls back gracefully if network access is unavailable

## Integration

The script is automatically integrated into the GitHub Actions workflow to run every 8 hours, ensuring that new race events are automatically discovered and added to the configuration as they are published on the FIA website.

## Output

The script updates two key parts of the configuration:
- `eventIds`: Array of event IDs used for fetching documents
- `eventMappings`: Object mapping event IDs to human-readable event names

## Error Handling

- **Network Errors**: The script exits gracefully with code 0 if the FIA website is unreachable
- **Parsing Errors**: If no events are found, the configuration remains unchanged
- **File Errors**: Configuration loading and saving errors are properly logged and cause the script to exit with code 1

## Testing

The script includes a test mode that uses sample HTML data to verify the parsing logic works correctly without requiring network access to the FIA website.