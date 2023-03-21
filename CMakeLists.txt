cmake_minimum_required(VERSION 3.0.2)
project(rvizweb)

find_package(catkin REQUIRED COMPONENTS
  rosbridge_server
  roswww
  tf2_web_republisher
)

catkin_package()

include_directories(
  ${catkin_INCLUDE_DIRS}
)

# Todos: Make it list the directories under webapps/ and build apps with one make command
# Install rvizweb
execute_process(
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webapps/rvizweb
  COMMAND npm install
)
execute_process(
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webapps/rvizweb
  COMMAND npm run build
)
# Build other webapps
execute_process(
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webapps/ros-node-graph
  COMMAND npm install
)
execute_process(
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webapps/ros-node-graph
  COMMAND npm run build
)

# Todos: optimize the delete command
execute_process(
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webapps
  COMMAND rm -rf rvizweb/bower_components rvizweb/node_modules ros-node-graph/node_modules
)

execute_process(
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
  COMMAND ln -s ./webapps/rvizweb/build/www ./www
)
