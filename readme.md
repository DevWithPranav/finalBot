# Bot Setup Instructions

## Preparation Steps

1. **Edit the `index.js` file**:
    - Uncomment the following line:
      ```javascript
      // import preloadQuestions from './database/functions/preloadQuestions.js'
      ```
    - Uncomment the following line:
      ```javascript
      // await preloadQuestions()
      ```

2. **Preload Questions**:
    - Start the bot by running:
      ```bash
      node ./shard.js
      ```
      or
      ```bash
      npm run dev
      ```
    - Wait for the console message confirming that the questions have been preloaded.
    - Shut down the bot.

3. **Revert Changes**:
    - Comment the lines you previously uncommented in `index.js`:
      ```javascript
      // import preloadQuestions from './database/functions/preloadQuestions.js'
      // await preloadQuestions()
      ```

4. **Run the Bot**:
    - Start the bot again using:
      ```bash
      node ./shard.js
      ```
      or
      ```bash
      npm run dev
      ```

## Environment Variables

Fill out the `.env` file with the following details:

```env
DISCORD_TOKEN=Enter your bot token here
MONGO_TOKEN=Enter MongoDB connection URL here
DISCORD_ID=Enter your bot ID
GUILD_ID=Enter your server ID
```

## Bot Commands

### `/setup-quiz`
- Use this command first to set up the quiz.

### `/start-quiz`
- Use this command to start the quiz after setup.

## Additional Information

- **Logs**:
  - Each section of the process is logged in the designated log channel.

- **Certificates**:
  - A certificate is generated and sent to the user's direct messages upon quiz completion.

