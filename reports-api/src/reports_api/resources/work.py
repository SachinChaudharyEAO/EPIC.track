# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Resource for work endpoints."""
from http import HTTPStatus

from flask import jsonify, request
from flask_restx import Namespace, Resource, cors

from reports_api.schemas import request as req
from reports_api.schemas import response as res
from reports_api.services import WorkService
from reports_api.utils import auth, profiletime
from reports_api.utils.util import cors_preflight


API = Namespace("works", description="Works")


@cors_preflight("GET")
@API.route("/exists", methods=["GET", "OPTIONS"])
class ValidateWork(Resource):
    """Endpoint resource to check for existing work."""

    @staticmethod
    @cors.crossdomain(origin="*")
    @auth.require
    @profiletime
    def get():
        """Check for existing works."""
        args = req.WorkExistenceQueryParamSchema().load(request.args)
        title = args["title"]
        work_id = args["work_id"]
        exists = WorkService.check_existence(title=title, work_id=work_id)
        return (
            {"exists": exists},
            HTTPStatus.OK,
        )


@cors_preflight("GET, POST")
@API.route("", methods=["GET", "POST", "OPTIONS"])
class Works(Resource):
    """Endpoint resource to manage works."""

    @staticmethod
    @cors.crossdomain(origin="*")
    @auth.require
    @profiletime
    def get():
        """Return all active works."""
        works = WorkService.find_all_works()
        return jsonify(res.WorkResponseSchema(many=True).dump(works)), HTTPStatus.OK

    @staticmethod
    @cors.crossdomain(origin="*")
    @auth.require
    @profiletime
    def post():
        """Create new work"""
        request_json = req.WorkBodyParameterSchema().load(API.payload)
        work = WorkService.create_work(request_json)
        return res.WorkResponseSchema().dump(work), HTTPStatus.CREATED


@cors_preflight("GET, DELETE, PUT")
@API.route("/<int:work_id>", methods=["GET", "PUT", "DELETE", "OPTIONS"])
class Work(Resource):
    """Endpoint resource to return work details."""

    @staticmethod
    @cors.crossdomain(origin="*")
    @auth.require
    @profiletime
    def get(work_id):
        """Return a work detail based on id."""
        req.WorkIdPathParameterSchema().load(request.view_args)
        work = WorkService.find_by_id(work_id)
        return res.WorkResponseSchema().dump(work), HTTPStatus.OK

    @staticmethod
    @cors.crossdomain(origin="*")
    @auth.require
    @profiletime
    def put(work_id):
        """Update and return a work."""
        req.WorkIdPathParameterSchema().load(request.view_args)
        request_json = req.WorkBodyParameterSchema().load(API.payload)
        work = WorkService.update_work(work_id, request_json)
        return res.WorkResponseSchema().dump(work), HTTPStatus.OK

    @staticmethod
    @cors.crossdomain(origin="*")
    @auth.require
    @profiletime
    def delete(work_id):
        """Delete a work"""
        req.WorkIdPathParameterSchema().load(request.view_args)
        WorkService.delete_work(work_id)
        return "Work successfully deleted", HTTPStatus.OK
