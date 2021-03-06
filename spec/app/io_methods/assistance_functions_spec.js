const AssistanceRequest = require('../../../app/models/assistanceRequest').model;
const Course = require('../../../app/models/course').model;
const {sendAssistanceRequestStatus, teacherResolveAssistanceRequest, initiateAssistanceRequest, resolveAssistanceRequestByStudentAndClass, retrieveAssistanceRequests, teacherResolveAllAssistanceRequests} = require('../../../app/io_methods/assistance_functions');
const io_broadcaster = require('../../../app/io_broadcaster');

describe('assistance_functions', () => {
    describe('>sendAssistanceRequestStatus', () => {
        it('should be defined', () => {
            expect(sendAssistanceRequestStatus).toBeDefined();
        });

        [{count: 1, expected: true}, {count: 0, expected: false}].forEach(testCase => {
            it(`should respond with status of ${testCase.expected} if the count of documents is ${testCase.count}`, async () => {
                const mock_socket = {
                    emit: () => undefined
                };

                const spy_countDocuments = spyOn(AssistanceRequest, 'countDocuments').and.returnValue(testCase.count);
                const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

                expect(await sendAssistanceRequestStatus(mock_socket, 'uid_1', 'cid_1')).toBeUndefined();

                expect(spy_countDocuments.calls.count()).toEqual(1);
                expect(spy_countDocuments.calls.argsFor(0)).toEqual([{
                    course: 'cid_1', student: 'uid_1', resolved: false
                }]);

                expect(spy_emit.calls.count()).toEqual(1);
                expect(spy_emit.calls.argsFor(0)).toEqual(['Response_AssistanceRequestStatus', {status: testCase.expected}]);
            });
        });
    });

    describe('>teacherResolveAssistanceRequest', () => {
        it('should be defined', () => {
            expect(teacherResolveAssistanceRequest).toBeDefined()
        });

        it('should find and resolve the assistance request', async () => {
            const mock_documentQuery = {
                updateOne: () => new Promise(done => done(undefined))
            };

            const spy_findById = spyOn(AssistanceRequest, 'findById').and.returnValue(mock_documentQuery);
            const spy_updateOne = spyOn(mock_documentQuery, 'updateOne').and.callThrough();
            const spy_broadcastGlobally = spyOn(io_broadcaster, 'broadcastGlobally').and.returnValue(undefined);
            const spy_now = spyOn(Date, 'now').and.returnValue('res_time');

            expect(await teacherResolveAssistanceRequest('test_ar_id')).toEqual(undefined);

            expect(spy_findById.calls.count()).toEqual(1);
            expect(spy_findById.calls.argsFor(0)).toEqual(['test_ar_id']);

            expect(spy_updateOne.calls.count()).toEqual(1);
            expect(spy_updateOne.calls.argsFor(0)).toEqual([{resolved: true, resolved_type: 'teacher', resolvedTime: 'res_time'}]);

            expect(spy_broadcastGlobally.calls.count()).toEqual(1);
            expect(spy_broadcastGlobally.calls.argsFor(0)).toEqual(['Broadcast_AssistanceRequestModified', null]);

            expect(spy_now.calls.count()).toEqual(1);
            expect(spy_now.calls.argsFor(0)).toEqual([]);
        });
    });

    describe('>initiateAssistanceRequest', () => {
        it('should be defined', () => {
            expect(initiateAssistanceRequest).toBeDefined();
        });

        it('should create a new assistance request and broadcast the change notification if one does not already exist', async () => {
            const spy_findOne = spyOn(AssistanceRequest, 'findOne').and.returnValue(new Promise(done => done(undefined)));
            const spy_create = spyOn(AssistanceRequest, 'create').and.returnValue(new Promise(done => done(undefined)));
            const spy_broadcastGlobally = spyOn(io_broadcaster, 'broadcastGlobally').and.returnValue(undefined);

            expect(await initiateAssistanceRequest('test_uid', 'test_cid')).toBeUndefined();

            expect(spy_findOne.calls.count()).toEqual(1);
            expect(spy_findOne.calls.argsFor(0)).toEqual([{student: 'test_uid', course: 'test_cid', resolved: false}]);

            expect(spy_create.calls.count()).toEqual(1);
            expect(spy_create.calls.argsFor(0)).toEqual([{student: 'test_uid', course: 'test_cid', resolved: false}]);

            expect(spy_broadcastGlobally.calls.count()).toEqual(1);
            expect(spy_broadcastGlobally.calls.argsFor(0)).toEqual(['Broadcast_AssistanceRequestModified', null]);
        });

        it('should do nothing if an unresolved request already exists', async () => {
            const spy_findOne = spyOn(AssistanceRequest, 'findOne').and.returnValue(new Promise(done => done('some_value')));
            const spy_create = spyOn(AssistanceRequest, 'create').and.returnValue(new Promise(done => done(undefined)));
            const spy_broadcastGlobally = spyOn(io_broadcaster, 'broadcastGlobally').and.returnValue(undefined);

            expect(await initiateAssistanceRequest('test_uid', 'test_cid')).toBeUndefined();

            expect(spy_findOne.calls.count()).toEqual(1);
            expect(spy_findOne.calls.argsFor(0)).toEqual([{student: 'test_uid', course: 'test_cid', resolved: false}]);

            expect(spy_create.calls.count()).toEqual(0);

            expect(spy_broadcastGlobally.calls.count()).toEqual(0);
        });
    });

    describe('>resolveAssistanceRequestByStudentAndClass', () => {
        it('should be defined', () => {
            expect(resolveAssistanceRequestByStudentAndClass).toBeDefined()
        });

        it('should find and resolve the assistance request', async () => {
            const mock_documentQuery = {
                updateMany: () => new Promise(done => done(undefined))
            };

            const spy_find = spyOn(AssistanceRequest, 'find').and.returnValue(mock_documentQuery);
            const spy_updateMany = spyOn(mock_documentQuery, 'updateMany').and.callThrough();
            const spy_broadcastGlobally = spyOn(io_broadcaster, 'broadcastGlobally').and.returnValue(undefined);
            const spy_now = spyOn(Date, 'now').and.returnValue('res_time');

            expect(await resolveAssistanceRequestByStudentAndClass('student_id', 'course_id')).toEqual(undefined);

            expect(spy_find.calls.count()).toEqual(1);
            expect(spy_find.calls.argsFor(0)).toEqual([{student: 'student_id', course: 'course_id', resolved: false}]);

            expect(spy_updateMany.calls.count()).toEqual(1);
            expect(spy_updateMany.calls.argsFor(0)).toEqual([{resolved: true, resolved_type: 'student', resolvedTime: 'res_time'}]);

            expect(spy_broadcastGlobally.calls.count()).toEqual(1);
            expect(spy_broadcastGlobally.calls.argsFor(0)).toEqual(['Broadcast_AssistanceRequestModified', null]);

            expect(spy_now.calls.count()).toEqual(1);
            expect(spy_now.calls.argsFor(0)).toEqual([]);
        });
    });

    describe('>retrieveAssistanceRequests', () => {
        it('should be defined', () => {
            expect(retrieveAssistanceRequests).toBeDefined();
        });

        it('should find unresolved assistance requests and return them sorted and populated with student', async () => {
            const mock_documentQuery = {
                sort: () => mock_documentQuery,
                populate: () => new Promise(done => done('request_values'))
            };

            const mock_socket = {
                emit: () => undefined
            };

            const spy_find = spyOn(AssistanceRequest, 'find').and.returnValue(mock_documentQuery);
            const spy_sort = spyOn(mock_documentQuery, 'sort').and.callThrough();
            const spy_populate = spyOn(mock_documentQuery, 'populate').and.callThrough();
            const spy_emit = spyOn(mock_socket, 'emit').and.callThrough();

            expect(await retrieveAssistanceRequests(mock_socket, 'test_cids')).toBeUndefined();

            expect(spy_find.calls.count()).toEqual(1);
            expect(spy_find.calls.argsFor(0)).toEqual([{course: {$in: 'test_cids'}, resolved: false}]);

            expect(spy_sort.calls.count()).toEqual(1);
            expect(spy_sort.calls.argsFor(0)).toEqual(['requestTime']);

            expect(spy_populate.calls.count()).toEqual(1);
            expect(spy_populate.calls.argsFor(0)).toEqual(['student']);

            expect(spy_emit.calls.count()).toEqual(1);
            expect(spy_emit.calls.argsFor(0)).toEqual(['Response_RetrieveAssistanceRequests', {requests: 'request_values'}]);
        });
    });

    describe('>teacherResolveAllAssistanceRequests', () => {
        it('should be defined', () => {
            expect(teacherResolveAllAssistanceRequests).toBeDefined();
        });

        it('should verify the course is taught by the user and update all requests to be resolve', async () => {
            const mock_documentQuery = {
                updateMany: () => new Promise(done => done(undefined))
            };

            const spy_verifyCourseTaughtBy = spyOn(Course, 'verifyCourseTaughtBy').and.returnValue(new Promise(done => done(undefined)));
            const spy_find = spyOn(AssistanceRequest, 'find').and.returnValue(mock_documentQuery);
            const spy_updateMany = spyOn(mock_documentQuery, 'updateMany').and.callThrough();
            const spy_broadcastGlobally = spyOn(io_broadcaster, 'broadcastGlobally').and.returnValue(undefined);
            const spy_now = spyOn(Date, 'now').and.returnValue('res_time');

            expect(await teacherResolveAllAssistanceRequests('test_uid', 'test_cid')).toBeUndefined();

            expect(spy_verifyCourseTaughtBy.calls.count()).toEqual(1);
            expect(spy_verifyCourseTaughtBy.calls.argsFor(0)).toEqual(['test_cid', 'test_uid']);

            expect(spy_find.calls.count()).toEqual(1);
            expect(spy_find.calls.argsFor(0)).toEqual([{course: 'test_cid', resolved: false}]);

            expect(spy_updateMany.calls.count()).toEqual(1);
            expect(spy_updateMany.calls.argsFor(0)).toEqual([{resolved: true, resolved_type: 'teacher', resolvedTime: 'res_time'}]);

            expect(spy_broadcastGlobally.calls.count()).toEqual(1);
            expect(spy_broadcastGlobally.calls.argsFor(0)).toEqual(['Broadcast_AssistanceRequestModified', null]);

            expect(spy_now.calls.count()).toEqual(1);
            expect(spy_now.calls.argsFor(0)).toEqual([]);
        });
    });
});