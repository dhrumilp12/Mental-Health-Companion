# Earlent - A Mental Health Platform
`Dhrumil Patel - Full Stack Developer`<br>
`Anthony Santana - Software Engineer in AI/ML`<br>
 ##How we built it 
- **Database:** [Azure Cosmos DB (v-core)](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/introduction) for its robust, scalable database services to manage dynamic data requirements efficiently.
- **LLM:** The [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview) platform was integrated for generating empathetic, context-aware responses through advanced AI models like GPT 3.5.
- **AI Services:** [Azure Speech Services](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview) enable users to interact with the platform using their voice, improving accessibility and user experience. Speech-to-text allowed users to input requests through speech, while text-to-speech provided responses audibly using _window.speechSynthesis_.
- **Frontend:** [React](https://react.dev) was chosen for its efficiency in building interactive user interfaces, with [Vite](https://vitejs.dev) used to optimize the development experience and [MUI](https://mui.com) (Material-UI) to design a modern, user-friendly interface.
- **Backend:** [Flask](https://flask.palletsprojects.com/en/3.0.x/) was chosen to manage backend operations, including API routing and middleware functionalities, due to its lightweight and unopinionated structure. 
- **Agentic Framework:** [LangChain](https://www.langchain.com) was integrated to enhance the AI's functionality, enabling the AI to keep track of conversation history and use tools for web search, vector search and map services.
- **Services & Libraries:** [pywebpush](https://pypi.org/project/pywebpush/) allowed for real-time communication with users through web push notifications, facilitated by user subscriptions managed through the Subscription model.  [Flask-Mail](https://pypi.org/project/Flask-Mail/) was used to manage email communications within the app.
- **CI/CD** [Docker](https://www.docker.com) was used to containerize the application, ensuring consistency across different computing environments. [Github Actions](https://docs.github.com/en/actions) was used to optimize the deployment process by wiring it directly to Azure's web services.
## View the Application
You may access the latest production site through https://mental-health-app-web.azurewebsites.net and the latest development mirror through https://green-sand-04b157b0f.5.azurestaticapps.net/. 
## Export the Application
1. Clone the repo
`https://github.com/janthonysantana/Mental-Health-Companion.git`
2. Build the server with Docker
```
cd ./server
docker build --pull --rm -t mental-health-app:latest .
```
3. Setup the frontend environment with NPM
```
cd ./client
npm install
```
4. Run the backend:
```docker run -d -p 4242:80 mental-health-app:latest```
5. Build the frontend:
```
npm run build
```
6. Execute the frontend:
```
npm run preview
```
