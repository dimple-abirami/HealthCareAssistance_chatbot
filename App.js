const { OpenAI } = require('openai');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

let conversationState = {
    currentQuestion: 0,
    questions: [],
    options:[],
    userResponses: []
};

app.get('/', (req, res) => {
    res.send('Welcome to the Medical Health Assistant API with GPT-3 language model');
});

app.post('/message', async (req, res) => {
  const userMessage = req.body.message;

  if (conversationState.currentQuestion < 4) {
      
    const predefinedQuestions = [
      {
          question: "What symptoms are you experiencing?",
          options: ["Fever", "Cough", "Headache", "Fatigue","Other"]
      },
      {
          question: "How long have you been experiencing these symptoms?",
          options: ["Less than a week", "1-2 weeks", "More than 2 weeks","Other"]
      },
      {
        question: "Have you tried any home remedies?",
        options: ["Yes", "No","Other"]
    },
    {
      question: "Do you have any pre-existing medical conditions?",
      options: ["Yes", "No","Other"]
  },
    
  ];
      if(conversationState.currentQuestion===0){
        conversationState.questions.push(predefinedQuestions[conversationState.currentQuestion].question);
        conversationState.options.push(predefinedQuestions[conversationState.currentQuestion].options);
      }
      else{
        conversationState.userResponses.push(userMessage);
        conversationState.questions.push(predefinedQuestions[conversationState.currentQuestion].question);
        conversationState.options.push(predefinedQuestions[conversationState.currentQuestion].options);
      }

      const currentPredefinedQuestion = predefinedQuestions[conversationState.currentQuestion];
      conversationState.currentQuestion++;

      res.json({ message: currentPredefinedQuestion.question,options: currentPredefinedQuestion.options });
  } else if (conversationState.currentQuestion < 10) {
      conversationState.userResponses.push(userMessage);
      conversationState.currentQuestion++;

      const additionalMessage = {
        role: "assistant",
        content: "provide relevent follow-up question with question mark at the end of the question with options that gets further important data from the user that helps in the successful and the best diagnosis of the disease.Strictly Dont repeat the questions already answered by the user.Always add others or say it descriptive as final options based on the question at the end.Strictly Give the question in one line and give the options in separate lines with 1. 2. tags"
    };
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversationState.questions.map(question => ({ role: "user", content: question })).concat({role:"user","content":"The options provided for each question are:"}).concat(conversationState.options.map(opt => ({ role: "user", content: opt.join(',') }))).concat({role:"user","content":"The answers provided for each question by the user are:"}).concat(conversationState.userResponses.map(response => ({ role: "user", content: response }))).concat(additionalMessage),
      max_tokens: 2048
    });
      const messageContent = completion.choices[0].message.content;
      const [questionPart, optionsPart] = messageContent.split('?');
      const question = questionPart.trim();
      const options = optionsPart.split('\n').slice(1).map(option => option.trim());
      conversationState.questions.push(question);
      res.json({ message: question, options: options });


  } else {
      conversationState.userResponses.push(userMessage);
      const additionalMessage = {
        role: "assistant",
        content: "from the above set of questions and answers accurately diagnose the disease/condition and provide the name of the disease for sure the user experiences and suggest what are some home remedies and what is the specialist they should visit to get treatment."
    };
      const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: conversationState.questions.map(question => ({ role: "user", content: question })).concat(conversationState.userResponses.map(response => ({ role: "user", content: response }))),
          max_tokens: 2048
      });
      conversationState.currentQuestion=0;
      res.json({ message: completion.choices[0].message.content });
  }
});


app.listen(3000, () => console.log('Listening on port 3002'));
