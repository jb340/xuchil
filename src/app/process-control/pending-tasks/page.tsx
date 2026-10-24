"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingTaskCard from "@/components/PendingTaskCard";
import styles from "./PendingTasks.module.css";
import { PendingTask } from "@/types/PendingTask";

const PendingTasksPage = () => {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const response = await fetch("/api/process-runs/pending", { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      if (!mounted) return;

      const mapped: PendingTask[] = data.map((run: any) => {
        const orderedSteps = [...(run.stepExecutions || [])];
        const allStepsDone =
          orderedSteps.length > 0 &&
          orderedSteps.every((step: any) => step.status === "DONE");
        const currentStepIndex = orderedSteps.findIndex(
          (step: any) =>
            step.status === "IN_PROGRESS" ||
            step.status === "PENDING" ||
            step.status === "BLOCKED"
        );
        const safeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
        const currentStep = orderedSteps[safeIndex];
        const openRoute = allStepsDone
          ? `/process-control/new-production/${run.productVariant?.productId}/${run.productVariantId}/results?runId=${run.id}`
          : `/process-control/new-production/${run.productVariant?.productId}/${run.productVariantId}/${safeIndex + 1}?templateId=${run.processTemplateId}`;
        const currentStepWorker =
          currentStep?.worker?.fullName ??
          currentStep?.stepParticipants?.find(
            (participant: any) => participant.worker?.fullName
          )?.worker?.fullName;

        return {
          id: run.id,
          productId: String(run.productVariant?.productId ?? ""),
          productName: run.productVariant?.name || "Producto",
          variantId: String(run.productVariantId),
          startDate: run.startedAt
            ? new Date(run.startedAt).toLocaleDateString("es-MX")
            : "",
          startedBy: run.creator?.fullName || currentStepWorker || "No asignado",
          currentStep: allStepsDone
            ? "Captura de resultados"
            : currentStep?.templateStep?.name || "Sin paso",
          currentStepNumber: allStepsDone ? orderedSteps.length : safeIndex + 1,
          totalSteps: orderedSteps.length || 0,
          openRoute,
        };
      });

      setTasks(mapped);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.head}>
        <h1 className={styles.title}>Tareas pendientes</h1>
        {tasks.length > 0 && (
          <span className={styles.count}>
            {tasks.length} {tasks.length === 1 ? "proceso" : "procesos"}
          </span>
        )}
      </header>

      {tasks.length === 0 ? (
        <p className={styles.empty}>No hay procesos en curso</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id}>
              <PendingTaskCard
                productName={task.productName}
                startDate={task.startDate}
                startedBy={task.startedBy}
                currentStep={task.currentStep}
                currentStepNumber={task.currentStepNumber}
                totalSteps={task.totalSteps}
                onClick={() => router.push(task.openRoute)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingTasksPage;
