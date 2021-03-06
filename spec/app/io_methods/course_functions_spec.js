const Course = require('../../../app/models/course').model;
const User = require('../../../app/models/user').model;
const Enrollment = require('../../../app/models/enrollment').model;
const {createCourse, renameCourse, deleteCourse, retrieveCourseKey, assignNewCourseKey} = require('../../../app/io_methods/course_functions');

const mock_socket = {
	emit: () => {}
};

describe('Course Functions', () => {
	describe('>createCourse', () => {
		[undefined, null, ''].forEach(courseName => {
			it(`should not create the course if the course name is ${courseName}`, async () => {
				expect(createCourse).toBeDefined();

				const test_user_id = 'abc123';

				const test_user = {
					_id: 'abc123'
				};

				const test_course = {
					_id: '424242'
				};

				const spy_findById = spyOn(User, 'findById').and.returnValue(new Promise(done => done(test_user)));
				const spy_create = spyOn(Course, 'create').and.returnValue(new Promise(done => done(test_course)));
				const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

				expect(await createCourse(mock_socket, test_user_id, courseName)).toEqual(undefined);

				expect(spy_findById.calls.count()).toEqual(1);
				expect(spy_findById.calls.argsFor(0).length).toEqual(1);
				expect(spy_findById.calls.argsFor(0)[0]).toEqual(test_user_id);

				expect(spy_create.calls.count()).toEqual(0);

				expect(spy_emit.calls.count()).toEqual(1);
				expect(spy_emit.calls.argsFor(0).length).toEqual(2);
				expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_CourseCreate');
				expect(spy_emit.calls.argsFor(0)[1]).toEqual({
					success: false,
					message: 'Class not created: Name must not be blank!'
				});

				expect(test_course._id).toEqual('424242');
			});
		});

		it('should not create the course if the user ID is invalid', async () => {
			expect(createCourse).toBeDefined();

			const test_user_id = 'abc123';

			const test_course = {
				_id: '424242'
			};

			const spy_findById = spyOn(User, 'findById').and.returnValue(new Promise(done => done(undefined)));
			const spy_create = spyOn(Course, 'create').and.returnValue(new Promise(done => done(test_course)));
			const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

			expect(await createCourse(mock_socket, test_user_id, 'test_course')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0).length).toEqual(1);
			expect(spy_findById.calls.argsFor(0)[0]).toEqual(test_user_id);

			expect(spy_create.calls.count()).toEqual(0);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0).length).toEqual(2);
			expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_CourseCreate');
			expect(spy_emit.calls.argsFor(0)[1]).toEqual({
				success: false,
				message: 'Class not created: user ID is invalid'
			});

			expect(test_course._id).toEqual('424242');
		});

		it('should create the course if all criteria are met', async () => {
			expect(createCourse).toBeDefined();

			const test_user_id = 'abc123';

			const test_user = {
				_id: 'abc123'
			};

			const test_course = {
				_id: '424242'
			};

			const spy_findById = spyOn(User, 'findById').and.returnValue(new Promise(done => done(test_user)));
			const spy_create = spyOn(Course, 'create').and.returnValue(new Promise(done => done(test_course)));
			const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

			expect(await createCourse(mock_socket, test_user_id, 'random_course_name')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0).length).toEqual(1);
			expect(spy_findById.calls.argsFor(0)[0]).toEqual(test_user_id);

			expect(spy_create.calls.count()).toEqual(1);
			expect(spy_create.calls.argsFor(0).length).toEqual(1);
			expect(spy_create.calls.argsFor(0)[0]).toEqual({teacher: test_user_id, courseName: 'random_course_name'});

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0).length).toEqual(2);
			expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_CourseCreate');
			expect(spy_emit.calls.argsFor(0)[1]).toEqual({
				courseId: '424242',
				courseName: 'random_course_name',
				message: 'Class created successfully.',
				success: true
			});

			expect(test_course._id).toEqual('424242');
		});
	});

	describe('>renameCourse', () => {
		[null, undefined, ''].forEach(newCourseName => {
			it(`should not rename the course if the new course name is ${newCourseName}`, async () => {
				expect(createCourse).toBeDefined();

				const test_course = {
					_id: '424242',
					courseName: 'original_course_name',
					save: () => {}
				};

				const spy_findById = spyOn(Course, 'findById').and.returnValue(new Promise(done => done(undefined)));
				const spy_save = spyOn(test_course, 'save').and.returnValue(new Promise(done => done(undefined)));
				const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

				expect(await renameCourse(mock_socket, '424242', newCourseName)).toEqual(undefined);

				expect(spy_findById.calls.count()).toEqual(0);

				expect(spy_save.calls.count()).toEqual(0);

				expect(spy_emit.calls.count()).toEqual(1);
				expect(spy_emit.calls.argsFor(0).length).toEqual(2);
				expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_RenameCourse');
				expect(spy_emit.calls.argsFor(0)[1]).toEqual({
					success: false,
					message: 'Class not renamed: Name must not be blank!'
				});

				expect(test_course._id).toEqual('424242');
				expect(test_course.courseName).toEqual('original_course_name');
			});
		});

		it(`should not rename the course if the course ID is invalid`, async () => {
			expect(createCourse).toBeDefined();

			const test_course = {
				_id: '424242',
				courseName: 'original_course_name',
				save: () => {}
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(new Promise(done => done(undefined)));
			const spy_save = spyOn(test_course, 'save').and.returnValue(new Promise(done => done(undefined)));
			const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

			expect(await renameCourse(mock_socket, '424242', 'newCourseName')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0).length).toEqual(1);
			expect(spy_findById.calls.argsFor(0)[0]).toEqual('424242');

			expect(spy_save.calls.count()).toEqual(0);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0).length).toEqual(2);
			expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_RenameCourse');
			expect(spy_emit.calls.argsFor(0)[1]).toEqual({
				success: false,
				message: 'Class not renamed: Invalid course ID'
			});

			expect(test_course._id).toEqual('424242');
			expect(test_course.courseName).toEqual('original_course_name');
		});

		it(`should rename the course if all conditions are met`, async () => {
			expect(createCourse).toBeDefined();

			const test_course = {
				_id: '424242',
				courseName: 'original_course_name',
				save: () => {}
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(new Promise(done => done(test_course)));
			const spy_save = spyOn(test_course, 'save').and.returnValue(new Promise(done => done(undefined)));
			const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);

			expect(await renameCourse(mock_socket, '424242', 'newCourseName')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0).length).toEqual(1);
			expect(spy_findById.calls.argsFor(0)[0]).toEqual('424242');

			expect(spy_save.calls.count()).toEqual(1);
			expect(spy_save.calls.argsFor(0).length).toEqual(0);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0).length).toEqual(2);
			expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_RenameCourse');
			expect(spy_emit.calls.argsFor(0)[1]).toEqual({
				success: true,
				message: 'Class renamed successfully.',
				courseId: '424242',
				courseName: 'newCourseName'
			});

			expect(test_course._id).toEqual('424242');
			expect(test_course.courseName).toEqual('newCourseName');
		});
	});

	describe('>deleteCourse', () => {
		it('should not delete the course if the user does not teach it', async () => {
			expect(deleteCourse).toBeDefined();

			const mock_course_document_query = {
				updateOne: () => new Promise(done => done(undefined))
			};

			const mock_enrollment_document_query = {
				updateMany: () => new Promise(done => done(undefined))
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(mock_course_document_query);
			const spy_verifyCourseTaughtBy = spyOn(Course, 'verifyCourseTaughtBy').and.throwError('Teacher does not teach class!');
			const spy_find = spyOn(Enrollment, 'find').and.returnValue(mock_enrollment_document_query);
			const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);
			const spy_updateOne = spyOn(mock_course_document_query, 'updateOne').and.returnValue(new Promise(done => done(undefined)));
			const spy_updateMany = spyOn(mock_enrollment_document_query, 'updateMany').and.returnValue(new Promise(done => done(undefined)));

			expect(await deleteCourse(mock_socket, 'user-id', 'course-id')).toEqual(undefined);

			expect(spy_verifyCourseTaughtBy.calls.count()).toEqual(1);
			expect(spy_verifyCourseTaughtBy.calls.argsFor(0).length).toEqual(2);
			expect(spy_verifyCourseTaughtBy.calls.argsFor(0)[0]).toEqual('course-id');
			expect(spy_verifyCourseTaughtBy.calls.argsFor(0)[1]).toEqual('user-id');

			expect(spy_findById.calls.count()).toEqual(0);

			expect(spy_find.calls.count()).toEqual(0);

			expect(spy_updateMany.calls.count()).toEqual(0);

			expect(spy_updateOne.calls.count()).toEqual(0);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0).length).toEqual(2);
			expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_DeleteCourse');
			expect(spy_emit.calls.argsFor(0)[1]).toEqual({
				success: false,
				message: 'Teacher does not teach class!'
			});
		});

		it('should delete the course if the user does teach it', async () => {
			expect(deleteCourse).toBeDefined();

			const mock_course_document_query = {
				updateOne: () => new Promise(done => done(undefined))
			};

			const mock_enrollment_document_query = {
				updateMany: () => new Promise(done => done(undefined))
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(mock_course_document_query);
			const spy_verifyCourseTaughtBy = spyOn(Course, 'verifyCourseTaughtBy').and.returnValue(new Promise(done => done(undefined)));
			const spy_find = spyOn(Enrollment, 'find').and.returnValue(mock_enrollment_document_query);
			const spy_emit = spyOn(mock_socket, 'emit').and.returnValue(undefined);
			const spy_updateOne = spyOn(mock_course_document_query, 'updateOne').and.returnValue(new Promise(done => done(undefined)));
			const spy_updateMany = spyOn(mock_enrollment_document_query, 'updateMany').and.returnValue(new Promise(done => done(undefined)));

			expect(await deleteCourse(mock_socket, 'user-id', 'course-id')).toEqual(undefined);

			expect(spy_verifyCourseTaughtBy.calls.count()).toEqual(1);
			expect(spy_verifyCourseTaughtBy.calls.argsFor(0).length).toEqual(2);
			expect(spy_verifyCourseTaughtBy.calls.argsFor(0)[0]).toEqual('course-id');
			expect(spy_verifyCourseTaughtBy.calls.argsFor(0)[1]).toEqual('user-id');

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0).length).toEqual(1);
			expect(spy_findById.calls.argsFor(0)[0]).toEqual('course-id');

			expect(spy_find.calls.count()).toEqual(1);
			expect(spy_find.calls.argsFor(0).length).toEqual(1);
			expect(spy_find.calls.argsFor(0)[0]).toEqual({course: 'course-id', valid: true});

			expect(spy_updateMany.calls.count()).toEqual(1);
			expect(spy_updateMany.calls.argsFor(0).length).toEqual(1);
			expect(spy_updateMany.calls.argsFor(0)[0]).toEqual({valid: false});

			expect(spy_updateOne.calls.count()).toEqual(1);
			expect(spy_updateOne.calls.argsFor(0).length).toEqual(1);
			expect(spy_updateOne.calls.argsFor(0)[0]).toEqual({valid: false});

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0).length).toEqual(2);
			expect(spy_emit.calls.argsFor(0)[0]).toEqual('Response_DeleteCourse');
			expect(spy_emit.calls.argsFor(0)[1]).toEqual({
				success: true,
				message: 'Successfully deleted class'
			});
		});
	});

	describe('>retrieveCourseKey', () => {
		it('should be defined', () => {
			expect(retrieveCourseKey).toBeDefined();
		});

		it('should respond with the existing key if it is defined and not a zero length string', async () => {
			const mock_course = {
				save: () => new Promise(done => done(undefined)),
				courseKey: 'courseKey_1',
				_id: 'other_cid'
			};

			const mock_socket = {
				emit: () => undefined
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(new Promise(done => done(mock_course)));
			const spy_generateCourseKey = spyOn(Course, 'generateCourseKey').and.returnValue('courseKey_2');
			const spy_save = spyOn(mock_course, 'save').and.callThrough();
			const spy_emit = spyOn(mock_socket, 'emit').and.callThrough();

			expect(await retrieveCourseKey(mock_socket, 'cid1')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0)).toEqual(['cid1']);

			expect(spy_generateCourseKey.calls.count()).toEqual(0);

			expect(spy_save.calls.count()).toEqual(0);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0)).toEqual(['Response_RetrieveCourseKey', {cid: 'other_cid', key: 'courseKey_1'}]);
		});
		
		it('should generate a new key if the existing key is undefined and respond with the new key', async () => {
			const mock_course = {
				save: () => new Promise(done => done(undefined)),
				courseKey: undefined,
				_id: 'other_cid'
			};

			const mock_socket = {
				emit: () => undefined
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(new Promise(done => done(mock_course)));
			const spy_generateCourseKey = spyOn(Course, 'generateCourseKey').and.returnValue('courseKey_2');
			const spy_save = spyOn(mock_course, 'save').and.callThrough();
			const spy_emit = spyOn(mock_socket, 'emit').and.callThrough();

			expect(await retrieveCourseKey(mock_socket, 'cid1')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0)).toEqual(['cid1']);

			expect(spy_generateCourseKey.calls.count()).toEqual(1);
			expect(spy_generateCourseKey.calls.argsFor(0)).toEqual([]);

			expect(spy_save.calls.count()).toEqual(1);
			expect(spy_save.calls.argsFor(0)).toEqual([]);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0)).toEqual(['Response_RetrieveCourseKey', {cid: 'other_cid', key: 'courseKey_2'}]);
		});
		
		it('should generate a new key if the existing key is zero length and respond with the new key', async () => {
			const mock_course = {
				save: () => new Promise(done => done(undefined)),
				courseKey: "",
				_id: 'other_cid'
			};

			const mock_socket = {
				emit: () => undefined
			};

			const spy_findById = spyOn(Course, 'findById').and.returnValue(new Promise(done => done(mock_course)));
			const spy_generateCourseKey = spyOn(Course, 'generateCourseKey').and.returnValue('courseKey_2');
			const spy_save = spyOn(mock_course, 'save').and.callThrough();
			const spy_emit = spyOn(mock_socket, 'emit').and.callThrough();

			expect(await retrieveCourseKey(mock_socket, 'cid1')).toEqual(undefined);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0)).toEqual(['cid1']);

			expect(spy_generateCourseKey.calls.count()).toEqual(1);
			expect(spy_generateCourseKey.calls.argsFor(0)).toEqual([]);

			expect(spy_save.calls.count()).toEqual(1);
			expect(spy_save.calls.argsFor(0)).toEqual([]);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0)).toEqual(['Response_RetrieveCourseKey', {cid: 'other_cid', key: 'courseKey_2'}]);
		});
	});

	describe('>assignNewCourseKey', () => {
		it('should be defined', () => {
			expect(assignNewCourseKey).toBeDefined();
		});

		it('should update the course with a new key and notify the user', async () => {
			const mock_documentQuery = {
				updateOne: () => new Promise(done => done(undefined))
			};

			const mock_socket = {
				emit: () => undefined
			};

			const spy_generateCourseKey = spyOn(Course, 'generateCourseKey').and.returnValue('new_key');
			const spy_findById = spyOn(Course, 'findById').and.returnValue(mock_documentQuery);
			const spy_updateOne = spyOn(mock_documentQuery, 'updateOne').and.callThrough();
			const spy_emit = spyOn(mock_socket, 'emit').and.callThrough();

			expect(await assignNewCourseKey(mock_socket, 'test_cid')).toBeUndefined();

			expect(spy_generateCourseKey.calls.count()).toEqual(1);
			expect(spy_generateCourseKey.calls.argsFor(0)).toEqual([]);

			expect(spy_findById.calls.count()).toEqual(1);
			expect(spy_findById.calls.argsFor(0)).toEqual(['test_cid']);

			expect(spy_updateOne.calls.count()).toEqual(1);
			expect(spy_updateOne.calls.argsFor(0)).toEqual([{courseKey: 'new_key'}]);

			expect(spy_emit.calls.count()).toEqual(1);
			expect(spy_emit.calls.argsFor(0)).toEqual(['Response_AssignNewCourseKey']);
		});
	});
});
