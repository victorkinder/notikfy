import {
  enqueueNotification,
  enqueueSaleNotification,
  enqueueAccumulatedCommissionNotification,
  NotificationPayload,
} from "../../src/services/taskQueue.service";
import { CloudTasksClient } from "@google-cloud/tasks";

jest.mock("@google-cloud/tasks");
jest.mock("../../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockCloudTasksClient = CloudTasksClient as jest.MockedClass<
  typeof CloudTasksClient
>;

describe("taskQueue.service", () => {
  let mockClient: jest.Mocked<CloudTasksClient>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };

    // Configurar variáveis de ambiente necessárias
    process.env.GCLOUD_PROJECT = "test-project";
    process.env.FUNCTION_REGION = "us-central1";
    process.env.NOTIFICATION_QUEUE_NAME = "notification-queue";
    process.env.NOTIFICATION_TASK_URL =
      "https://us-central1-test-project.cloudfunctions.net/processNotificationTask";

    // Mock do cliente Cloud Tasks
    mockClient = {
      queuePath: jest.fn().mockReturnValue("projects/test-project/locations/us-central1/queues/notification-queue"),
      createTask: jest.fn().mockResolvedValue([
        {
          name: "projects/test-project/locations/us-central1/queues/notification-queue/tasks/task-123",
        },
      ]),
    } as any;

    mockCloudTasksClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("enqueueNotification", () => {
    it("deve enfileirar notificação de venda com sucesso", async () => {
      const payload: NotificationPayload = {
        type: "sale",
        userId: "user-123",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      };

      const taskId = await enqueueNotification(payload);

      expect(mockClient.queuePath).toHaveBeenCalledWith(
        "test-project",
        "us-central1",
        "notification-queue"
      );
      expect(mockClient.createTask).toHaveBeenCalledWith({
        parent: "projects/test-project/locations/us-central1/queues/notification-queue",
        task: {
          httpRequest: {
            httpMethod: "POST",
            url: "https://us-central1-test-project.cloudfunctions.net/processNotificationTask",
            headers: {
              "Content-Type": "application/json",
            },
            body: expect.any(String),
          },
        },
      });
      expect(taskId).toBe("task-123");
    });

    it("deve enfileirar notificação de comissão acumulada com sucesso", async () => {
      const payload: NotificationPayload = {
        type: "accumulated_commission",
        userId: "user-123",
        accumulatedAmount: 500,
        threshold: 250,
      };

      const taskId = await enqueueNotification(payload);

      expect(mockClient.createTask).toHaveBeenCalled();
      expect(taskId).toBe("task-123");
    });

    it("deve lançar erro se userId não for fornecido", async () => {
      const payload = {
        type: "sale",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      } as any;

      await expect(enqueueNotification(payload)).rejects.toThrow(
        "userId é obrigatório no payload"
      );
    });

    it("deve lançar erro se type não for fornecido", async () => {
      const payload = {
        userId: "user-123",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      } as any;

      await expect(enqueueNotification(payload)).rejects.toThrow(
        "type é obrigatório no payload"
      );
    });

    it("deve propagar erro do Cloud Tasks", async () => {
      const payload: NotificationPayload = {
        type: "sale",
        userId: "user-123",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      };

      const error = new Error("Cloud Tasks error");
      mockClient.createTask = jest.fn().mockRejectedValue(error);

      await expect(enqueueNotification(payload)).rejects.toThrow(
        "Cloud Tasks error"
      );
    });
  });

  describe("enqueueSaleNotification", () => {
    it("deve enfileirar notificação de venda corretamente", async () => {
      const taskId = await enqueueSaleNotification("user-123", {
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        orderId: "order-123",
      });

      expect(mockClient.createTask).toHaveBeenCalled();
      expect(taskId).toBe("task-123");
    });
  });

  describe("enqueueAccumulatedCommissionNotification", () => {
    it("deve enfileirar notificação de comissão acumulada corretamente", async () => {
      const taskId = await enqueueAccumulatedCommissionNotification(
        "user-123",
        500,
        250
      );

      expect(mockClient.createTask).toHaveBeenCalled();
      expect(taskId).toBe("task-123");
    });
  });
});

