const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'minor-project',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const addNewLearningResourceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewLearningResource', inputVars);
}
addNewLearningResourceRef.operationName = 'AddNewLearningResource';
exports.addNewLearningResourceRef = addNewLearningResourceRef;

exports.addNewLearningResource = function addNewLearningResource(dcOrVars, vars) {
  return executeMutation(addNewLearningResourceRef(dcOrVars, vars));
};

const getCoursesForInstructorRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCoursesForInstructor');
}
getCoursesForInstructorRef.operationName = 'GetCoursesForInstructor';
exports.getCoursesForInstructorRef = getCoursesForInstructorRef;

exports.getCoursesForInstructor = function getCoursesForInstructor(dc) {
  return executeQuery(getCoursesForInstructorRef(dc));
};

const enrollInCourseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnrollInCourse', inputVars);
}
enrollInCourseRef.operationName = 'EnrollInCourse';
exports.enrollInCourseRef = enrollInCourseRef;

exports.enrollInCourse = function enrollInCourse(dcOrVars, vars) {
  return executeMutation(enrollInCourseRef(dcOrVars, vars));
};

const listPublicLearningResourcesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicLearningResources');
}
listPublicLearningResourcesRef.operationName = 'ListPublicLearningResources';
exports.listPublicLearningResourcesRef = listPublicLearningResourcesRef;

exports.listPublicLearningResources = function listPublicLearningResources(dc) {
  return executeQuery(listPublicLearningResourcesRef(dc));
};
