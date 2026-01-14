import * as tf from '@tensorflow/tfjs';

// Input Feature Vector (Normalized 0-1)
// [AVG_QUIZ_SCORE, STUDY_HOURS_THIS_WEEK, COMPLETED_TASKS_COUNT, SUBJECT_DIFFICULTY]
export type InputVector = [number, number, number, number];

export class GradePredictor {
    private model: tf.Sequential;

    constructor() {
        this.model = tf.sequential();

        // Input Layer: 4 features
        this.model.add(tf.layers.dense({
            units: 8,
            activation: 'relu',
            inputShape: [4]
        }));

        // Hidden Layer
        this.model.add(tf.layers.dense({
            units: 4,
            activation: 'relu'
        }));

        // Output Layer: 1 value (Predicted Percentage 0-100)
        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'linear' // or 'sigmoid' if we normalize output to 0-1
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError'
        });
    }

    async train(data: { inputs: InputVector[], labels: number[] }) {
        const xs = tf.tensor2d(data.inputs);
        const ys = tf.tensor2d(data.labels, [data.labels.length, 1]);

        console.log("Training Grade Predictor...");
        await this.model.fit(xs, ys, {
            epochs: 50,
            callbacks: {
                onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch}: loss = ${logs?.loss}`)
            }
        });

        xs.dispose();
        ys.dispose();
        console.log("Training Complete");
    }

    predict(input: InputVector): number {
        const xs = tf.tensor2d([input]);
        const output = this.model.predict(xs) as tf.Tensor;
        const result = output.dataSync()[0];

        xs.dispose();
        output.dispose();

        return result;
    }

    async save() {
        if (typeof window === 'undefined') return;
        await this.model.save('localstorage://grade-predictor-model');
    }

    async load() {
        if (typeof window === 'undefined') return;
        try {
            this.model = await tf.loadLayersModel('localstorage://grade-predictor-model') as tf.Sequential;
            this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        } catch (e) {
            console.log("No saved model found, using fresh instance.");
        }
    }
}

// Singleton Pattern for HMR support
const globalForGradePredictor = globalThis as unknown as { gradePredictor: GradePredictor | undefined };

export const gradePredictor = globalForGradePredictor.gradePredictor ?? new GradePredictor();

if (process.env.NODE_ENV !== 'production') globalForGradePredictor.gradePredictor = gradePredictor;
