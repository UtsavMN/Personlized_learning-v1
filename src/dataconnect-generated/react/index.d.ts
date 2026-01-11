import { AddNewLearningResourceData, AddNewLearningResourceVariables, GetCoursesForInstructorData, EnrollInCourseData, EnrollInCourseVariables, ListPublicLearningResourcesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAddNewLearningResource(options?: useDataConnectMutationOptions<AddNewLearningResourceData, FirebaseError, AddNewLearningResourceVariables>): UseDataConnectMutationResult<AddNewLearningResourceData, AddNewLearningResourceVariables>;
export function useAddNewLearningResource(dc: DataConnect, options?: useDataConnectMutationOptions<AddNewLearningResourceData, FirebaseError, AddNewLearningResourceVariables>): UseDataConnectMutationResult<AddNewLearningResourceData, AddNewLearningResourceVariables>;

export function useGetCoursesForInstructor(options?: useDataConnectQueryOptions<GetCoursesForInstructorData>): UseDataConnectQueryResult<GetCoursesForInstructorData, undefined>;
export function useGetCoursesForInstructor(dc: DataConnect, options?: useDataConnectQueryOptions<GetCoursesForInstructorData>): UseDataConnectQueryResult<GetCoursesForInstructorData, undefined>;

export function useEnrollInCourse(options?: useDataConnectMutationOptions<EnrollInCourseData, FirebaseError, EnrollInCourseVariables>): UseDataConnectMutationResult<EnrollInCourseData, EnrollInCourseVariables>;
export function useEnrollInCourse(dc: DataConnect, options?: useDataConnectMutationOptions<EnrollInCourseData, FirebaseError, EnrollInCourseVariables>): UseDataConnectMutationResult<EnrollInCourseData, EnrollInCourseVariables>;

export function useListPublicLearningResources(options?: useDataConnectQueryOptions<ListPublicLearningResourcesData>): UseDataConnectQueryResult<ListPublicLearningResourcesData, undefined>;
export function useListPublicLearningResources(dc: DataConnect, options?: useDataConnectQueryOptions<ListPublicLearningResourcesData>): UseDataConnectQueryResult<ListPublicLearningResourcesData, undefined>;
