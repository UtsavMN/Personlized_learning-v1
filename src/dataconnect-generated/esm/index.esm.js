import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'minor-project',
  location: 'us-east4'
};

export const addNewLearningResourceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewLearningResource', inputVars);
}
addNewLearningResourceRef.operationName = 'AddNewLearningResource';

export function addNewLearningResource(dcOrVars, vars) {
  return executeMutation(addNewLearningResourceRef(dcOrVars, vars));
}

export const getCoursesForInstructorRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCoursesForInstructor');
}
getCoursesForInstructorRef.operationName = 'GetCoursesForInstructor';

export function getCoursesForInstructor(dc) {
  return executeQuery(getCoursesForInstructorRef(dc));
}

export const enrollInCourseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnrollInCourse', inputVars);
}
enrollInCourseRef.operationName = 'EnrollInCourse';

export function enrollInCourse(dcOrVars, vars) {
  return executeMutation(enrollInCourseRef(dcOrVars, vars));
}

export const listPublicLearningResourcesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicLearningResources');
}
listPublicLearningResourcesRef.operationName = 'ListPublicLearningResources';

export function listPublicLearningResources(dc) {
  return executeQuery(listPublicLearningResourcesRef(dc));
}

