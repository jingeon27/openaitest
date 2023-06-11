import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IChatResponse,
  IGetChatList,
  IOpenAiServiceCreateChat,
  IOpenAiServiceReflection,
  IOpenAiServiceUpdateChat,
} from './interface/openai.interface';
import { ChatConversation } from './entities/question.entity';
import { OpenAi } from 'src/apis/openai/entities/openai.entity';

@Injectable()
export class OpenAiService {
  private CONTEXT_INSTRUCTION = 'Based on this context:';
  private INSTRUCTION = ``;
  private openai: OpenAIApi;
  constructor(
    @InjectRepository(OpenAi)
    private readonly openaiRepository: Repository<OpenAi>,

    @InjectRepository(ChatConversation)
    private readonly chatConversation: Repository<ChatConversation>,
  ) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }
  // async createMenuList(prompt: string, context: string) {
  //   const completion = await this.openai.createCompletion({
  //     model: 'gpt-3.5-turbo',
  //     prompt: `${this.CONTEXT_INSTRUCTION}\n\n\nContext: "${context}" \n\n\n${this.INSTRUCTION} \n\n\n ${prompt}`,
  //     max_tokens: 300,
  //     temperature: 1,
  //   });

  //   return completion?.data.choices?.[0]?.text;
  // }
  // async reflection({
  //   location,
  //   situation,
  //   question,
  // }: IOpenAiServiceReflection): Promise<string> {
  //   const max_tokens = question + 1000;
  //   const completion = await this.openai.createCompletion({
  //     model: 'text-davinci-003',
  //     prompt: `${location}에서 ${situation}이란 상황으로 ${question}자보다 많지만 인접하게 반성문을 작성해줘`,
  //     max_tokens,
  //     temperature: 1,
  //   });
  //   return completion?.data.choices?.[0]?.text;
  // }
  async chatResponse({ question }: IChatResponse): Promise<string> {
    const completion = await this.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: question,
    });
    return completion?.data.choices[0].message.content;
  }
  async getChatList({ context }: IGetChatList): Promise<OpenAi[]> {
    return await this.openaiRepository.find({
      where: { id: context.req.user.id },
    });
  }
  async update({ question, id }: IOpenAiServiceUpdateChat) {
    return await this.openaiRepository
      .save({
        id,
        date: parseInt(
          new Date().toISOString().substring(0, 10).replace(/-/g, ''),
        ),
      })
      .then((res) =>
        question.map((e) => this.chatConversation.save({ ...e, openAi: res })),
      );
  }
  async create({ question, context, name }: IOpenAiServiceCreateChat) {
    const title = await this.openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${question[0].content}를 요약해줘`,
      max_tokens: 30,
    });
    return await this.openaiRepository
      .save({
        title: title.data.choices[0].text,
        user: context.req.user,
        date: parseInt(
          new Date().toISOString().substring(0, 10).replace(/-/g, ''),
        ),
        name,
      })
      .then((res) =>
        question.map((e) =>
          this.chatConversation.insert({ ...e, openAi: res }),
        ),
      );
  }
}
