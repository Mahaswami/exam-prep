async function extractQuestionsFromQB(questions_attachment_file: any, conceptNames:any,isInventQuestions = false) {
    let prepURL = window.service_url + window.spreadsheetId + "/exam_prep/prepQuestions";
    let headers = {'Content-Type': 'application/json'}
    const body = {
        app: window.app_name,
        env: window.app_env,
        questionBankFile: questions_attachment_file,
        concepts: conceptNames,
        isInventQuestions: isInventQuestions
    }
    let response = await fetch(prepURL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });
    if(response.ok)
    {
        const responseText = await response.text();
        const cleanedResponse = responseText.replace(/\\{3,}/g, "\\\\");
        const responseData = JSON.parse(cleanedResponse);
        return responseData;
    }
    else {
        throw new Error(`Error in extractQuestionsFromQB: ${response.status} ${response.statusText}`);
    }
}

async function extractConceptsFromQB(questions_attachment_file: any) {
    let prepURL = window.service_url + window.spreadsheetId + "/exam_prep/identifyChapterConcepts";
    let headers = {'Content-Type': 'application/json'}
    const body = {
        app: window.app_name,
        env: window.app_env,
        questionBankFile: questions_attachment_file,
    }
    let response = await fetch(prepURL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });
    if(response.ok)
    {
        const responseText = await response.text();
        const cleanedResponse = responseText.replace(/\\{3,}/g, "\\\\");
        const responseData = JSON.parse(cleanedResponse);
        return responseData;
    }
    else {
        throw new Error(`Error in extractQuestionsFromQB: ${response.status} ${response.statusText}`);
    }
}

async function uploadPreparedQuestions(questions: any[],concepts: any[],isInventQuestions = false) {
    const dataProvider = (window as any).swanAppFunctions.dataProvider;
    const questionRecords = [];
    for (const question of questions) {
        const concept = concepts.find((c: any) => c.name === question.concept);
        const conceptId = concept ? concept.id : null;
        const questionData = {
            type: question.type,
            question_stream: JSON.stringify(question.question_stream),
            options: JSON.stringify(question.options),
            correct_option: question.correct_option,
            difficulty: question.difficulty,
            concept_id: conceptId,
            hint: question.hint,
            final_answer: question.final_answer,
            answer_stream: JSON.stringify(question.detailed_solution_stream),
            status: "Need-Verification",
            is_invented: isInventQuestions,
        };
        questionRecords.push(questionData);
    }
   // const dbTransactionId = await dataProvider.beginTransaction();
    const {data: existingQuestions} = await dataProvider.getList('questions', {filter: {concept_id: concepts.map(c => c.id)}});
    if (!isInventQuestions && existingQuestions.length > 0) {
        await dataProvider.deleteMany('questions', {
            ids: existingQuestions.map((exQ: {
                id: any;
            }) => exQ.id)
        });
    }
    /*for (const questionRecord of questionRecords) {
        await dataProvider.create('questions', {data: questionRecord});
    }*/
    const bulkCreateRequests = [];
    for (const questionRecord of questionRecords) {
        bulkCreateRequests.push(
            {
                type:'create',
                resource:'questions',
                params: {
                    data: {
                        ...questionRecord
                    }
                }
            }
        );
    }
    const dbTransactionId = await dataProvider.beginTransaction();
    await dataProvider.executeBatch(bulkCreateRequests, dbTransactionId);
    await dataProvider.commitTransaction(dbTransactionId);
}

export const prepareQuestions = async(chapterId:any,questions_attachment_file: any,isInventQuestions = false) => {
  try {
      //Get Concepts for the chapter
      const dataProvider = (window as any).swanAppFunctions.dataProvider;
      const {data: concepts} = await dataProvider.getList('concepts', {
          filter: {chapter_id: chapterId},
          sort: {field: 'concept_order_number', order: 'ASC'}
      });

      const conceptNames = concepts.map((concept: any) => concept.name);
      console.log('Concept Names for question preparation: ', conceptNames.toString());

      let response = await extractQuestionsFromQB(questions_attachment_file, conceptNames,isInventQuestions);
        console.log("Prepared Questions Response: ", response);
        if (response.questions && response.questions.length > 0) {
           console.log("Uploading prepared questions to data provider...");
           const questions = response.questions;
           await uploadPreparedQuestions(questions,concepts,isInventQuestions);
        } else {
            console.log("No questions prepared from the question bank.");
        }
  }
  catch (Error) {
      console.log("Error: Preparing Questions. Please try again", Error);
  }
}

export const uploadChapterConcepts = async(chapterId:any,conceptualMap:any[]) => {
    const concepts = [];
    const dataProvider = (window as any).swanAppFunctions.dataProvider;
    try {
        for(const concept of conceptualMap){
            concepts.push({
                chapter_id: chapterId,
                name: concept.broad_concept,
                concept_order_number: concepts.length + 1,
                weightage: concept.weightage,
                is_active: true
            })
        }
        const { data: existingConcepts } = await dataProvider.getList('concepts', {
            filter: { chapter_id: chapterId }
        });
        if (existingConcepts.length > 0) {
            await dataProvider.deleteMany('concepts', {
                ids: existingConcepts.map((exC: {
                    id: any;
                }) => exC.id)
            });
        }
        const bulkCreateRequests = [];
        for (const concept of concepts) {
            bulkCreateRequests.push(
                {
                    type: 'create',
                    resource: 'concepts',
                    params: { data: { ...concept } }
                }
            );
        }
        const dbTransactionId = await dataProvider.beginTransaction();
        await dataProvider.executeBatch(bulkCreateRequests, dbTransactionId);
        await dataProvider.commitTransaction(dbTransactionId);
    } catch (Error) {
        console.log("Error uploading chapter concept: ", Error);
    }
}

export const generateDiagnosticQuestions = async(chapterId:any) => {
    try {

        let prepURL = window.service_url + window.spreadsheetId + "/exam_prep/generateDiagnosticQuestions";
        let headers = {'Content-Type': 'application/json'}
        const body = {
            app: window.app_name,
            env: window.app_env,
            chapterId: chapterId
        }
        let response = await fetch(prepURL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });
        if(response.ok)
        {
           //Response json with selected question ids
           const responseData = await response.json();
           console.log("Diagnostic Test Questions Response: ", responseData);
           if (responseData.question_ids && responseData.question_ids.length > 0) {
               //Create Chapter Diagnostic Question Records
               const dataProvider = (window as any).swanAppFunctions.dataProvider;
               const questionRecords = [];
               for (const questionId of responseData.question_ids) {
                   const questionData = {
                       chapter_id: chapterId,
                       question_id: questionId,
                       question_order_number: questionRecords.length + 1,
                   };
                   questionRecords.push(questionData);
               }
                const dbTransactionId = await dataProvider.beginTransaction();
                for (const questionRecord of questionRecords) {
                    await dataProvider.create('chapter_diagnostic_questions', {data: questionRecord}, {dbTransactionId});
                }
                await dataProvider.commitTransaction(dbTransactionId);
           }
        }
        else {
            throw new Error(`Error in generateDiagnosticTest: ${response.status} ${response.statusText}`);
        }
    }
    catch (Error) {
        console.log("Error: Generating Diagnostic Test. Please try again", Error);
    }
}
export const identifyConceptsForChapter = async (questions_attachment_file: any) => {
    try {
        let response = await extractConceptsFromQB(questions_attachment_file);
        console.log("Identify Chapters Response: ", response);
        return response;
    } catch (Error) {
        console.log("Error: Preparing Questions. Please try again", Error);
    }
}