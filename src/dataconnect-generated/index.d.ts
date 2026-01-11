import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddNewLearningResourceData {
  learningResource_insert: LearningResource_Key;
}

export interface AddNewLearningResourceVariables {
  title: string;
  resourceType: string;
}

export interface Assignment_Key {
  id: UUIDString;
  __typename?: 'Assignment_Key';
}

export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface EnrollInCourseData {
  enrollment_insert: Enrollment_Key;
}

export interface EnrollInCourseVariables {
  courseId: UUIDString;
}

export interface Enrollment_Key {
  studentId: UUIDString;
  courseId: UUIDString;
  __typename?: 'Enrollment_Key';
}

export interface GetCoursesForInstructorData {
  courses: ({
    id: UUIDString;
    title: string;
    courseCode: string;
    description?: string | null;
  } & Course_Key)[];
}

export interface LearningResource_Key {
  id: UUIDString;
  __typename?: 'LearningResource_Key';
}

export interface ListPublicLearningResourcesData {
  learningResources: ({
    id: UUIDString;
    title: string;
    resourceType: string;
    content?: string | null;
  } & LearningResource_Key)[];
}

export interface Submission_Key {
  id: UUIDString;
  __typename?: 'Submission_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface AddNewLearningResourceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddNewLearningResourceVariables): MutationRef<AddNewLearningResourceData, AddNewLearningResourceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddNewLearningResourceVariables): MutationRef<AddNewLearningResourceData, AddNewLearningResourceVariables>;
  operationName: string;
}
export const addNewLearningResourceRef: AddNewLearningResourceRef;

export function addNewLearningResource(vars: AddNewLearningResourceVariables): MutationPromise<AddNewLearningResourceData, AddNewLearningResourceVariables>;
export function addNewLearningResource(dc: DataConnect, vars: AddNewLearningResourceVariables): MutationPromise<AddNewLearningResourceData, AddNewLearningResourceVariables>;

interface GetCoursesForInstructorRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCoursesForInstructorData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCoursesForInstructorData, undefined>;
  operationName: string;
}
export const getCoursesForInstructorRef: GetCoursesForInstructorRef;

export function getCoursesForInstructor(): QueryPromise<GetCoursesForInstructorData, undefined>;
export function getCoursesForInstructor(dc: DataConnect): QueryPromise<GetCoursesForInstructorData, undefined>;

interface EnrollInCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnrollInCourseVariables): MutationRef<EnrollInCourseData, EnrollInCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: EnrollInCourseVariables): MutationRef<EnrollInCourseData, EnrollInCourseVariables>;
  operationName: string;
}
export const enrollInCourseRef: EnrollInCourseRef;

export function enrollInCourse(vars: EnrollInCourseVariables): MutationPromise<EnrollInCourseData, EnrollInCourseVariables>;
export function enrollInCourse(dc: DataConnect, vars: EnrollInCourseVariables): MutationPromise<EnrollInCourseData, EnrollInCourseVariables>;

interface ListPublicLearningResourcesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicLearningResourcesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPublicLearningResourcesData, undefined>;
  operationName: string;
}
export const listPublicLearningResourcesRef: ListPublicLearningResourcesRef;

export function listPublicLearningResources(): QueryPromise<ListPublicLearningResourcesData, undefined>;
export function listPublicLearningResources(dc: DataConnect): QueryPromise<ListPublicLearningResourcesData, undefined>;

