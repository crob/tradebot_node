import { TaskType } from './../enums/task-type';
import { Injectable } from '@tsed/di';
import Queue from 'bee-queue';

export interface QueueConnectionRedisOptions {
  host: string;
  port: string;
  password: string;
}

export interface QueueConnectionOptions {
  removeOnSuccess?: boolean;
  redis: QueueConnectionRedisOptions;
}

@Injectable()
export class TaskQueueService {
  defaultConfig: QueueConnectionOptions;

  init(defaultConfigOptions: QueueConnectionOptions) {
    this.defaultConfig = defaultConfigOptions;
  }

  createTask(taskName: TaskType, processFunc, processCount = 1, options?: Partial<QueueConnectionOptions>): Queue {
    const queue =  new Queue(taskName, {...this.defaultConfig, ...options});
    queue.process(processCount, processFunc);
    return queue;
  }

  runJob(queue: Queue, jobData: any): Queue {
    queue.createJob(jobData).save();
    return queue;
  }
}