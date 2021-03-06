import serverPath from '../paths';
import axios from 'axios';

export const
  REQUEST_ASSESSMENT = 'REQUEST_ASSESSMENT',
  ASSESSMENT_SUCCESS = 'ASSESSMENT_SUCCESS',
  ASSESSMENT_FAILURE = 'ASSESSMENT_FAILURE',
  REQUEST_UPDATE = 'REQUEST_UPDATE',
  UPDATE_ASSESSMENT = 'UPDATE_ASSESSMENT'

export const requestAssessment = (userId, rubricId) => ({
  type: REQUEST_ASSESSMENT,
  isFetching: true
})

export const receiveAssessment = (assessment) => ({
  type: ASSESSMENT_SUCCESS,
  isFetching: false,
  assessment
})

export const assessmentError = (message) => ({
  type: ASSESSMENT_FAILURE,
  isFetching: false,
  message
})

export const requestUpdateAssessment = () => ({
  type: REQUEST_UPDATE,
  isFetching: true
})

export const setUpdatedAssessment = (assessment) => ({
  type: UPDATE_ASSESSMENT,
  isFetching: false,
  assessment
})

// takes in a criteriaId and an assessment
// sends a call to the backend to update the assessment with the new value
// for the specified criteriaId
// then sends the updated assessment in an action to set the state with
// the updated assessment
export function updateAssessment(assessment, criteriaId){

  // look through the assessment object to find the criteria
  // with the id criteriaId

  var newRubricJson = {
    ...assessment.rubricJSON,
    Competencies: assessment.rubricJSON.Competencies.map((comp, index) => {
      return {
        ...comp,
        Scales: comp.Scales.map((scale, index) => {
          return {
            ...scale,
            Criteria: scale.Criteria.map((criteria, index) => {
              if (criteria.id === criteriaId) {
                return {
                  ...criteria,
                  answer: !criteria.answer // toggle the answer
                }
              } else {
                return criteria
              }
            }).sort((a , b) => {
              return a.id - b.id;
            })
          }
        }).sort((a , b) => {
          return a.id - b.id;
        })
      }
    }).sort((a , b) => {
      return a.id - b.id;
    })
  }


  var newAssessment = {
    ...assessment,
    rubricJSON: newRubricJson
  }

  return dispatch => {
    dispatch(requestUpdateAssessment());
    return axios.post(`${serverPath}/assessments/${newAssessment.id}`, newAssessment).then((res) => {
      if (res.status !== 200) {
        dispatch(assessmentError(res.message));
        return Promise.reject("Could not update assessment");
      }
      return res.data.assessment;
    }).then((assessment) => {
      dispatch(setUpdatedAssessment(assessment));
    }).catch(err => console.log("Error: " + err));
  }

}

// GET ASSESSMENT BY ID - assessments show or create
export function getAssessment(userId, rubricId) {
  let config = {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  }

  return dispatch => {
    dispatch(requestAssessment(userId, rubricId));
    return fetch(`${serverPath}/users/${userId}/rubrics/${rubricId}/assessments`, config).then((res) => {
      if (res.status !== 200) {
        dispatch(assessmentError(res.message));
        return Promise.reject("Could not get assessment")
      }
      return res.json();
    }).then((json) => {
      const { assessment } = json
      console.log('ASSESSMENT', assessment)

      const sortedAsessment = assessment.rubricJSON.Competencies.map((comp, index) => {
        return {
          ...comp,
          Scales: comp.Scales.map((scale, index) => {
            return {
              ...scale,
              Criteria: scale.Criteria.map((criteria, index) => {
                return criteria
              }).sort((a , b) => {
                return a.id - b.id;
              })
            }
          }).sort((a , b) => {
            return a.id - b.id;
          })
        }
      }).sort((a , b) => {
        return a.id - b.id;
      })
      dispatch(receiveAssessment({...assessment, rubricJSON: {...assessment.rubricJSON, Competencies: [...sortedAsessment]}}))
    }).catch(err => console.log("Error: " + err));
  }
}
